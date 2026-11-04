import crypto from 'crypto';
import { ApiError, audit, hasPermission, requireAuth } from '../auth';
import { AUTHORITY_ROLES, ELECTION_STATUS, NOTIFICATION_TYPE, PERMISSIONS, ROLES } from '../constants';
import {
  AnonymousBallot,
  Class,
  CRElection,
  CRCandidate,
  CRAssignment,
  Notification,
  User,
  VotingAuthorization,
} from '../models';
import type { RouteContext } from '../http';
import { asArray, json, makeId, pageParams, paginated, requireString } from '../http';

const VOTE_SECRET = process.env.VOTE_HASH_SECRET || process.env.JWT_ACCESS_SECRET || 'campusvoice-vote-secret';

function ballotHash(userId: string, electionId: string) {
  return crypto.createHash('sha256').update(`${userId}:${electionId}:${VOTE_SECRET}`).digest('hex');
}

export async function handleElections(ctx: RouteContext): Promise<Response | null> {
  const [root, id, action] = ctx.segments;
  if (root === 'elections') {
    if (ctx.method === 'GET' && !id) return listElections(ctx);
    if ((ctx.method === 'GET' || ctx.method === 'POST') && id === 'cron') return runElectionCron(ctx);
    if (ctx.method === 'POST' && !id) return createElection(ctx);
    if (ctx.method === 'GET' && id && !action) return getElection(ctx, id);
    if (ctx.method === 'POST' && id && action === 'nominate') return nominate(ctx, id);
    if (ctx.method === 'POST' && id && action === 'vote') return castVote(ctx, id);
    if (ctx.method === 'POST' && id && action === 'close') return closeElection(ctx, id);
    if (ctx.method === 'POST' && id && action === 'certify') return certifyElection(ctx, id);
  }
  if (root === 'cr' && id === 'assignments' && ctx.method === 'GET') return listAssignments(ctx);
  return null;
}

function canManage(role: string) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.REGISTRAR || AUTHORITY_ROLES.includes(role as any);
}

/* ---------------------------------------------------------------------------
 * Automatic weekly CR election cycle.
 * Every Sunday a 24-hour election opens for each active class, with every
 * student auto-enrolled as a candidate so a ballot always exists. When the
 * window closes (Monday) `closeExpiredElections` finalises it and the winner
 * is automatically promoted to Class Representative.
 * ------------------------------------------------------------------------- */
function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function currentSundayWindow(now = new Date()) {
  const todayMidnight = startOfDay(now);
  const sundayStart = new Date(todayMidnight);
  sundayStart.setDate(todayMidnight.getDate() - todayMidnight.getDay()); // 0 = Sunday
  const windowEnd = new Date(sundayStart.getTime() + 24 * 60 * 60 * 1000); // Monday 00:00
  const nextSunday = new Date(sundayStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { sundayStart, windowEnd, nextSunday, inWindow: now >= sundayStart && now < windowEnd };
}

async function ensureWeeklyElections(classId?: string) {
  const { sundayStart, windowEnd, nextSunday, inWindow } = currentSundayWindow();
  if (!inWindow) return; // Elections only open during the Sunday 24h window.

  const classFilter: Record<string, unknown> = { isActive: true };
  if (classId) classFilter._id = classId;
  const classes = await Class.find(classFilter).limit(200).lean();

  for (const klass of classes) {
    const existing = await CRElection.findOne({
      classId: klass._id,
      opensAt: { $gte: sundayStart },
    })
      .select('_id')
      .lean();
    if (existing) continue;

    const students = await User.find({
      classId: klass._id,
      role: { $in: [ROLES.STUDENT, ROLES.CLASS_REPRESENTATIVE] },
      isActive: true,
    })
      .select('_id fullName username')
      .lean();
    if (students.length === 0) continue;

    let election;
    try {
      election = await CRElection.create({
        electionId: makeId('ELECTION'),
        classId: klass._id,
        className: klass.name,
        title: 'Weekly Class Representative Election',
        opensAt: sundayStart,
        closesAt: windowEnd,
        nominationOpensAt: sundayStart,
        nominationClosesAt: sundayStart,
        status: ELECTION_STATUS.ACTIVE,
        totalEligibleVoters: students.length,
        schedulingMode: 'auto_schedule',
        nextElectionAt: nextSunday,
      });
    } catch {
      continue; // Another concurrent request already created it.
    }

    try {
      await CRCandidate.insertMany(
        students.map((student: any) => ({
          electionId: election._id,
          studentId: student._id,
          studentName: student.fullName || student.username,
          className: klass.name,
          manifesto: '',
          status: 'approved',
          votes: 0,
        })),
        { ordered: false },
      );
    } catch {
      // Ignore duplicate-key races on candidate enrolment.
    }

    try {
      await Notification.insertMany(
        students.map((student: any) => ({
          userId: student._id,
          type: NOTIFICATION_TYPE.ELECTION_OPENED,
          title: 'CR election is open',
          message:
            'Voting for your Class Representative is open for 24 hours. Cast your vote before it closes on Monday.',
          data: { electionId: election._id.toString() },
        })),
      );
    } catch {
      // Notifications are best-effort.
    }
  }
}

async function runElectionCron(ctx: RouteContext) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided =
      ctx.req.headers.get('authorization') || ctx.searchParams.get('key') || '';
    if (provided !== `Bearer ${secret}` && provided !== secret) {
      throw new ApiError('Unauthorized', 401);
    }
  }
  await ensureWeeklyElections(undefined);
  await closeExpiredElections(undefined);
  return json({ ok: true, ranAt: new Date().toISOString() });
}

async function listElections(ctx: RouteContext) {
  const user = await requireAuth(ctx.req);
  const { page, limit, skip } = pageParams(ctx.searchParams, 50);
  const filter: Record<string, unknown> = {};

  if (ctx.searchParams.get('classId')) filter.classId = ctx.searchParams.get('classId');
  if (ctx.searchParams.get('status')) filter.status = ctx.searchParams.get('status');

  // Students and CRs only see elections for their own class.
  if ([ROLES.STUDENT, ROLES.CLASS_REPRESENTATIVE].includes(user.role as any)) {
    if (!user.classId) return json(paginated([], 0, page, limit));
    filter.classId = user.classId;
  } else if (!canManage(user.role) && user.classId) {
    filter.classId = user.classId;
  }

  await ensureWeeklyElections(filter.classId as string | undefined);
  await closeExpiredElections(filter.classId as string | undefined);

  const [data, total] = await Promise.all([
    CRElection.find(filter).sort({ opensAt: -1 }).skip(skip).limit(limit).lean(),
    CRElection.countDocuments(filter),
  ]);
  return json(paginated(data, total, page, limit));
}

async function createElection(ctx: RouteContext) {
  const user = await requireAuth(ctx.req);
  if (!canManage(user.role) && !hasPermission(user, PERMISSIONS.ELECTIONS_CREATE)) {
    throw new ApiError('You do not have permission to create elections', 403);
  }
  const body = await ctx.body();
  const classId = requireString(body.classId, 'Class');
  const klass = await Class.findById(classId);
  if (!klass) throw new ApiError('Class not found', 404);

  const opensAt = body.opensAt ? new Date(body.opensAt) : new Date();
  const closesAt = body.closesAt
    ? new Date(body.closesAt)
    : new Date(opensAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  const election = await CRElection.create({
    electionId: makeId('ELECTION'),
    classId: klass._id,
    className: klass.name,
    title: body.title || 'Weekly Class Representative Election',
    opensAt,
    closesAt,
    nominationOpensAt: body.nominationOpensAt ? new Date(body.nominationOpensAt) : opensAt,
    nominationClosesAt: body.nominationClosesAt ? new Date(body.nominationClosesAt) : opensAt,
    status: opensAt <= new Date() ? ELECTION_STATUS.ACTIVE : ELECTION_STATUS.SCHEDULED,
    totalEligibleVoters: await User.countDocuments({ classId: klass._id, role: { $in: [ROLES.STUDENT, ROLES.CLASS_REPRESENTATIVE] } }),
    schedulingMode: body.schedulingMode || 'manual',
    nextElectionAt: new Date(closesAt.getTime() + 7 * 24 * 60 * 60 * 1000),
  });

  await audit('election_created', { user, entityType: 'CRElection', entityId: election._id.toString() });
  return json(election.toObject(), 201);
}

async function getElection(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  await closeExpiredElections(undefined);
  const election = await CRElection.findById(id).lean();
  if (!election) throw new ApiError('Election not found', 404);
  const candidates = await CRCandidate.find({ electionId: election._id, status: { $ne: 'rejected' } })
    .sort({ votes: -1, createdAt: 1 })
    .lean();
  const hasVoted = Boolean(
    await VotingAuthorization.exists({ userId: user.sub, scope: 'election', electionId: election._id }),
  );
  return json({
    ...election,
    candidates,
    hasVoted,
    isEligible: election.classId?.toString() === user.classId,
  });
}

async function nominate(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  if (![ROLES.STUDENT, ROLES.CLASS_REPRESENTATIVE].includes(user.role as any)) {
    throw new ApiError('Only students can nominate themselves', 403);
  }
  const election = await CRElection.findById(id);
  if (!election) throw new ApiError('Election not found', 404);
  if (!user.classId || election.classId.toString() !== user.classId) {
    throw new ApiError('You can only nominate yourself in your own class election', 403);
  }
  if (![ELECTION_STATUS.NOMINATION_OPEN, ELECTION_STATUS.SCHEDULED, ELECTION_STATUS.ACTIVE].includes(election.status as any)) {
    throw new ApiError('Nominations are not open for this election', 409);
  }
  const body = await ctx.body();
  const candidate = await CRCandidate.findOneAndUpdate(
    { electionId: election._id, studentId: user.sub },
    {
      $setOnInsert: {
        electionId: election._id,
        studentId: user.sub,
        studentName: user.fullName || user.username,
        className: election.className,
        manifesto: body.manifesto || '',
        status: 'approved',
        votes: 0,
      },
    },
    { upsert: true, new: true },
  );
  return json(candidate.toObject(), 201);
}

async function castVote(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  if (![ROLES.STUDENT, ROLES.CLASS_REPRESENTATIVE].includes(user.role as any)) {
    throw new ApiError('Only students can vote in CR elections', 403);
  }
  const election = await CRElection.findById(id);
  if (!election) throw new ApiError('Election not found', 404);
  if (election.status !== ELECTION_STATUS.ACTIVE) {
    throw new ApiError('This election is not currently open for voting', 409);
  }
  if (election.opensAt > new Date() || election.closesAt < new Date()) {
    throw new ApiError('Voting is outside the scheduled window', 409);
  }
  if (!user.classId || election.classId.toString() !== user.classId) {
    throw new ApiError('You are not eligible to vote in this class election', 403);
  }
  const body = await ctx.body();
  const candidateId = requireString(body.candidateId, 'Candidate');
  const candidate = await CRCandidate.findOne({ _id: candidateId, electionId: election._id });
  if (!candidate) throw new ApiError('Candidate not found in this election', 404);
  if (candidate.studentId.toString() === user.sub) {
    throw new ApiError('You cannot vote for yourself', 403);
  }

  const hash = ballotHash(user.sub, election._id.toString());
  try {
    await AnonymousBallot.create({
      scope: 'election',
      electionId: election._id,
      voterHash: hash,
      candidateId: candidate._id,
    });
    await VotingAuthorization.create({
      userId: user.sub,
      scope: 'election',
      electionId: election._id,
      used: true,
      usedAt: new Date(),
    });
  } catch (error: any) {
    if (error?.code === 11000) throw new ApiError('You have already voted in this election', 409);
    throw error;
  }

  await Promise.all([
    CRCandidate.updateOne({ _id: candidate._id }, { $inc: { votes: 1 } }),
    CRElection.updateOne(
      { _id: election._id },
      { $inc: { totalParticipatingVoters: 1, validVotes: 1 } },
    ),
  ]);
  await audit('vote', {
    user,
    entityType: 'CRElection',
    entityId: election._id.toString(),
    metadata: { scope: 'election' },
  });
  return json({ success: true, message: 'Your anonymous vote has been recorded' });
}

async function closeElection(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  if (!canManage(user.role) && !hasPermission(user, PERMISSIONS.ELECTIONS_MANAGE)) {
    throw new ApiError('You do not have permission to close elections', 403);
  }
  const election = await CRElection.findById(id);
  if (!election) throw new ApiError('Election not found', 404);
  await finalizeElection(election, user);
  return json(election.toObject());
}

async function certifyElection(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  if (!canManage(user.role) && !hasPermission(user, PERMISSIONS.ELECTIONS_CERTIFY)) {
    throw new ApiError('You do not have permission to certify elections', 403);
  }
  const election = await CRElection.findById(id);
  if (!election) throw new ApiError('Election not found', 404);
  if (election.status !== ELECTION_STATUS.CLOSED) {
    await finalizeElection(election, user);
  }
  election.status = ELECTION_STATUS.CERTIFIED;
  election.certifiedAt = new Date();
  await election.save();
  return json(election.toObject());
}

async function closeExpiredElections(classId?: string) {
  const filter: Record<string, unknown> = {
    status: ELECTION_STATUS.ACTIVE,
    closesAt: { $lte: new Date() },
  };
  if (classId) filter.classId = classId;
  const expired = await CRElection.find(filter).limit(20);
  for (const election of expired) {
    await finalizeElection(election, null);
  }
}

async function finalizeElection(election: any, actor: any) {
  if (election.status === ELECTION_STATUS.CERTIFIED) return;

  const candidates = await CRCandidate.find({ electionId: election._id, status: { $ne: 'rejected' } })
    .sort({ votes: -1, createdAt: 1 })
    .lean();
  const totalVotes = candidates.reduce((sum, c: any) => sum + (c.votes || 0), 0);
  const top = totalVotes > 0 ? candidates[0] : null;
  const tied = top ? candidates.filter((c: any) => c.votes === top.votes) : [];

  election.status = ELECTION_STATUS.CLOSED;
  election.totalParticipatingVoters = totalVotes;
  election.validVotes = totalVotes;
  if (top) {
    election.winnerId = top.studentId;
    election.winnerName = top.studentName;
    election.tieBreakerMethod = tied.length > 1 ? 'earliest_nomination' : 'none';
    await CRCandidate.updateOne({ _id: top._id }, { $set: { status: 'winner' } });
  }
  await election.save();

  if (!top) return;

  const klass = await Class.findById(election.classId);
  const previousCrId = klass?.crId?.toString();

  await CRAssignment.updateMany(
    { classId: election.classId, isActive: true },
    { $set: { isActive: false, revokedAt: new Date(), revokedReason: 'New CR elected' } },
  );

  if (previousCrId && previousCrId !== top.studentId.toString()) {
    const previous = await User.findById(previousCrId);
    if (previous && previous.role === ROLES.CLASS_REPRESENTATIVE) {
      previous.role = ROLES.STUDENT;
      previous.permissions = [PERMISSIONS.ELECTIONS_VOTE, PERMISSIONS.PROPOSALS_VOTE];
      await previous.save();
    }
  }

  const winner = await User.findById(top.studentId);
  if (winner) {
    winner.role = ROLES.CLASS_REPRESENTATIVE;
    winner.permissions = [
      PERMISSIONS.PROPOSALS_CREATE,
      PERMISSIONS.PROPOSALS_FORWARD,
      PERMISSIONS.PROPOSALS_PUBLISH,
    ];
    if (election.classId) winner.classId = election.classId;
    await winner.save();
  }
  if (klass) {
    klass.crId = top.studentId;
    await klass.save();
  }
  await CRAssignment.create({
    classId: election.classId,
    studentId: top.studentId,
    electionId: election._id,
    assignedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
  });

  const students = await User.find({
    classId: election.classId,
    role: { $in: [ROLES.STUDENT, ROLES.CLASS_REPRESENTATIVE] },
  })
    .select('_id')
    .lean();
  if (students.length) {
    await Notification.insertMany(
      students.map((student: any) => ({
        userId: student._id,
        type: NOTIFICATION_TYPE.CR_APPOINTED,
        title: 'CR election result',
        message: `${top.studentName} has been elected as your Class Representative.`,
        data: { electionId: election._id.toString() },
      })),
    );
  }

  await audit('cr_assign', {
    user: actor,
    entityType: 'CRElection',
    entityId: election._id.toString(),
    metadata: { winnerId: top.studentId.toString() },
  });
}

async function listAssignments(ctx: RouteContext) {
  const user = await requireAuth(ctx.req);
  const filter: Record<string, unknown> = { isActive: true };
  if (ctx.searchParams.get('classId')) filter.classId = ctx.searchParams.get('classId');
  if ([ROLES.STUDENT, ROLES.CLASS_REPRESENTATIVE].includes(user.role as any) && user.classId) {
    filter.classId = user.classId;
  }
  const data = await CRAssignment.find(filter).sort({ assignedAt: -1 }).lean();
  return json(data);
}
