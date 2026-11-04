import crypto from 'crypto';
import { Types } from 'mongoose';
import { ApiError, audit, hasPermission, requireAuth } from '../auth';
import {
  AUTHORITY_ROLES,
  NOTIFICATION_TYPE,
  PERMISSIONS,
  PROPOSAL_STATUS,
  PROPOSAL_TYPE,
  ROLES,
} from '../constants';
import {
  AnonymousBallot,
  Class,
  Escalation,
  ManagementReview,
  Notification,
  Proposal,
  Resolution,
  User,
  VotingAuthorization,
} from '../models';
import type { RouteContext } from '../http';
import { asArray, escapeRegex, json, makeId, pageParams, paginated, requireString } from '../http';

const VOTE_SECRET = process.env.VOTE_HASH_SECRET || process.env.JWT_ACCESS_SECRET || 'campusvoice-vote-secret';

function voterHash(userId: string, proposalId: string) {
  return crypto.createHash('sha256').update(`${userId}:${proposalId}:${VOTE_SECRET}`).digest('hex');
}

function isAuthority(role: string) {
  return AUTHORITY_ROLES.includes(role as any);
}

function canManageProposals(role: string) {
  return role === ROLES.CLASS_REPRESENTATIVE || isAuthority(role);
}

function canReview(role: string) {
  return role === ROLES.TEACHER || isAuthority(role);
}

export async function handleProposals(ctx: RouteContext): Promise<Response | null> {
  const [root, id, action] = ctx.segments;
  if (root !== 'proposals') return null;

  if (ctx.method === 'GET' && !id) return listProposals(ctx);
  if (ctx.method === 'POST' && !id) return createProposal(ctx);
  if (ctx.method === 'GET' && id && id !== 'pid') return getProposal(ctx, id);
  if (ctx.method === 'GET' && id === 'pid' && action) return getProposalByPid(ctx, action);

  if (ctx.method === 'POST' && id && action === 'vote') return vote(ctx, id);
  if (ctx.method === 'POST' && id && action === 'start-voting') return startVoting(ctx, id);
  if (ctx.method === 'POST' && id && action === 'close-voting') return closeVoting(ctx, id);
  if (ctx.method === 'POST' && id && action === 'forward') return forward(ctx, id);
  if (ctx.method === 'POST' && id && action === 'review') return review(ctx, id);
  if (ctx.method === 'POST' && id && action === 'resolve') return resolve(ctx, id);
  if (ctx.method === 'POST' && id && action === 'escalate') return escalate(ctx, id);
  if (ctx.method === 'POST' && id && action === 'reject') return reject(ctx, id);
  if (ctx.method === 'DELETE' && id) return remove(ctx, id);
  if (ctx.method === 'PATCH' && id && action === 'publish') return startVoting(ctx, id);
  if (ctx.method === 'PATCH' && id && action === 'certify') return certify(ctx, id);

  return null;
}

async function listProposals(ctx: RouteContext) {
  const user = await requireAuth(ctx.req);
  const { page, limit, skip } = pageParams(ctx.searchParams, 50);
  const filter: Record<string, unknown> = {};

  const status = ctx.searchParams.get('status');
  const type = ctx.searchParams.get('type');
  const category = ctx.searchParams.get('category');
  const community = ctx.searchParams.get('community');
  const search = ctx.searchParams.get('search');
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (community) filter.community = community;
  if (ctx.searchParams.get('mine') === 'true') filter.createdBy = user.sub;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { proposalId: rx }];
  }

  // Confidential items are only visible to their author and authority roles.
  if (!isAuthority(user.role)) {
    filter.$and = [
      {
        $or: [
          { confidentiality: { $ne: 'confidential' } },
          { createdBy: user.sub },
        ],
      },
    ];
  }

  const [data, total] = await Promise.all([
    Proposal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Proposal.countDocuments(filter),
  ]);
  return json(paginated(data, total, page, limit));
}

async function createProposal(ctx: RouteContext) {
  const user = await requireAuth(ctx.req);
  const body = await ctx.body();

  const type = String(body.type || PROPOSAL_TYPE.STUDENT_CONCERN);
  if (!Object.values(PROPOSAL_TYPE).includes(type as any)) {
    throw new ApiError('Invalid proposal type', 422);
  }

  const isStudentConcern = type === PROPOSAL_TYPE.STUDENT_CONCERN;
  if (isStudentConcern && !canManageProposals(user.role)) {
    throw new ApiError('Only a Class Representative or an authority can publish formal student concerns', 403);
  }
  if (!isStudentConcern && !(user.role === ROLES.TEACHER || isAuthority(user.role))) {
    throw new ApiError('Only teachers and authorities can publish this type of proposal', 403);
  }

  const title = requireString(body.title, 'Title');
  const description = requireString(body.description, 'Description');
  const department = requireString(body.department || body.departmentName || 'General', 'Department');

  const proposal = await Proposal.create({
    proposalId: makeId('CV'),
    createdBy: user.sub,
    crId: isStudentConcern ? user.sub : undefined,
    title,
    description,
    category: body.category || 'Institutional Improvement',
    type,
    department,
    community: body.community || (isStudentConcern ? 'student' : 'teacher'),
    classId: body.classId || user.classId || undefined,
    proposedSolution: body.proposedSolution,
    supportingEvidence: asArray(body.supportingEvidence),
    attachments: asArray(body.attachments),
    confidentiality: body.confidentiality || 'public',
    status: PROPOSAL_STATUS.VOTING_ACTIVE,
    audienceType: body.audienceType || (isStudentConcern ? 'class' : 'institution'),
    targetRole: body.targetRole,
    raisedByName: user.fullName || user.username,
    raisedByRole: user.role,
    votedUserIds: [],
    votingOpenedAt: new Date(),
    events: [
      {
        action: isStudentConcern ? 'raised' : 'created',
        actorId: user.sub,
        actorName: user.fullName || user.username,
        actorRole: user.role,
        note: isStudentConcern ? 'Concern published for class voting.' : 'Proposal published for voting.',
        at: new Date(),
      },
      {
        action: 'voting_opened',
        actorId: user.sub,
        actorName: user.fullName || user.username,
        actorRole: user.role,
        note: 'Voting opened automatically on publication.',
        at: new Date(),
      },
    ],
  });

  if (type === PROPOSAL_TYPE.MANAGEMENT_REVIEW) {
    await ManagementReview.create({
      proposalId: proposal._id,
      reviewId: makeId('REVIEW'),
      reviewType: body.reviewType || 'Formal Management Review',
      subject: title,
      submittedBy: user.sub,
      submittedByName: user.fullName || user.username,
      community: 'teacher',
      status: 'submitted',
      responseDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
  }

  const audience = await User.find({
    _id: { $ne: user.sub },
    role: { $in: isStudentConcern ? [ROLES.STUDENT, ROLES.CLASS_REPRESENTATIVE] : [ROLES.TEACHER, ...AUTHORITY_ROLES] },
    ...(isStudentConcern && user.classId ? { classId: user.classId } : {}),
  })
    .select('_id')
    .limit(200)
    .lean();

  if (audience.length) {
    await Notification.insertMany(
      audience.map((member: any) => ({
        userId: member._id,
        type: NOTIFICATION_TYPE.VOTING_OPENED,
        title: isStudentConcern ? 'A new class concern is open for voting' : 'A new proposal is open for voting',
        message: title,
        data: { proposalId: proposal._id.toString() },
      })),
    );
  }

  await audit('create_proposal', {
    user,
    entityType: 'Proposal',
    entityId: proposal._id.toString(),
    metadata: { type },
  });

  return json(proposal.toObject(), 201);
}

async function getProposal(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  const proposal = await Proposal.findById(id).select('+votedUserIds').lean();
  if (!proposal) {
    const byPid = await Proposal.findOne({ proposalId: id }).select('+votedUserIds').lean();
    if (!byPid) throw new ApiError('Proposal not found', 404);
    return decorated(byPid, user);
  }
  return decorated(proposal, user);
}

async function getProposalByPid(ctx: RouteContext, proposalId: string) {
  const user = await requireAuth(ctx.req);
  const proposal = await Proposal.findOne({ proposalId }).select('+votedUserIds').lean();
  if (!proposal) throw new ApiError('Proposal not found', 404);
  return decorated(proposal, user);
}

function decorated(proposal: any, user: { sub: string }) {
  const votedUserIds: string[] = proposal.votedUserIds || [];
  return json({
    ...proposal,
    votedUserIds: undefined,
    isOwner: proposal.createdBy?.toString() === user.sub,
    hasVoted: votedUserIds.includes(user.sub),
  });
}

async function vote(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  const body = await ctx.body();
  const choice = String(body.choice || '');
  if (!['support', 'oppose', 'abstain'].includes(choice)) {
    throw new ApiError('Vote choice must be support, oppose or abstain', 422);
  }
  const proposal = await Proposal.findById(id).select('+votedUserIds');
  if (!proposal) throw new ApiError('Proposal not found', 404);
  if (proposal.status !== PROPOSAL_STATUS.VOTING_ACTIVE) {
    throw new ApiError('Voting is not open for this item', 409);
  }
  if (proposal.createdBy?.toString() === user.sub) {
    throw new ApiError('You cannot vote on your own submission', 403);
  }
  if ((proposal.votedUserIds || []).includes(user.sub)) {
    throw new ApiError('You have already voted on this item', 409);
  }

  // Enforce community eligibility without exposing individual choices.
  if (proposal.community === 'teacher' && !(user.role === ROLES.TEACHER || isAuthority(user.role))) {
    throw new ApiError('This vote is open to the teacher community only', 403);
  }

  const hash = voterHash(user.sub, proposal._id.toString());
  try {
    await AnonymousBallot.create({
      scope: 'proposal',
      proposalId: proposal._id,
      voterHash: hash,
      choice,
    });
    await VotingAuthorization.create({
      userId: user.sub,
      scope: 'proposal',
      proposalId: proposal._id,
      used: true,
      usedAt: new Date(),
    });
  } catch (error: any) {
    if (error?.code === 11000) throw new ApiError('You have already voted on this item', 409);
    throw error;
  }

  const field = choice === 'support' ? 'supportVotes' : choice === 'oppose' ? 'opposeVotes' : 'abstainVotes';
  const updated = await Proposal.findOneAndUpdate(
    { _id: proposal._id, votedUserIds: { $ne: user.sub }, status: PROPOSAL_STATUS.VOTING_ACTIVE },
    { $inc: { [field]: 1 }, $addToSet: { votedUserIds: user.sub } },
    { new: true },
  );
  if (!updated) throw new ApiError('Your vote could not be recorded', 409);

  await audit('vote', {
    user,
    entityType: 'Proposal',
    entityId: proposal._id.toString(),
    metadata: { scope: 'proposal' },
  });

  return json({ success: true, message: 'Your anonymous vote has been recorded' });
}

async function startVoting(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  if (!canManageProposals(user.role) && !hasPermission(user, PERMISSIONS.PROPOSALS_PUBLISH)) {
    throw new ApiError('You do not have permission to open voting', 403);
  }
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new ApiError('Proposal not found', 404);
  if (proposal.status === PROPOSAL_STATUS.VOTING_ACTIVE) return json(proposal.toObject());
  if ([PROPOSAL_STATUS.RESOLVED, PROPOSAL_STATUS.REJECTED, PROPOSAL_STATUS.CERTIFIED].includes(proposal.status as any)) {
    throw new ApiError('This item can no longer be opened for voting', 409);
  }
  proposal.status = PROPOSAL_STATUS.VOTING_ACTIVE;
  proposal.votingOpenedAt = new Date();
  proposal.events.push({
    action: 'voting_opened',
    actorId: user.sub,
    actorName: user.fullName || user.username,
    actorRole: user.role,
    note: 'Voting opened.',
    at: new Date(),
  });
  await proposal.save();
  return json(proposal.toObject());
}

async function closeVoting(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  if (!canManageProposals(user.role) && !hasPermission(user, PERMISSIONS.PROPOSALS_PUBLISH)) {
    throw new ApiError('You do not have permission to close voting', 403);
  }
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new ApiError('Proposal not found', 404);
  if (proposal.status !== PROPOSAL_STATUS.VOTING_ACTIVE) {
    throw new ApiError('Voting is not active for this item', 409);
  }
  proposal.status = PROPOSAL_STATUS.VOTING_CLOSED;
  proposal.votingClosedAt = new Date();
  proposal.events.push({
    action: 'voting_closed',
    actorId: user.sub,
    actorName: user.fullName || user.username,
    actorRole: user.role,
    note: 'Voting closed.',
    at: new Date(),
  });
  await proposal.save();
  return json(proposal.toObject());
}

async function forward(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  if (!canManageProposals(user.role) && !hasPermission(user, PERMISSIONS.PROPOSALS_FORWARD)) {
    throw new ApiError('You do not have permission to forward this item', 403);
  }
  const body = await ctx.body();
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new ApiError('Proposal not found', 404);
  const forwardTo = String(body.forwardTo || 'TEACHER');
  proposal.status = PROPOSAL_STATUS.FORWARDED;
  proposal.forwardedTo = forwardTo;
  proposal.events.push({
    action: 'forwarded',
    actorId: user.sub,
    actorName: user.fullName || user.username,
    actorRole: user.role,
    note: body.note || `Forwarded to ${forwardTo}.`,
    at: new Date(),
  });
  await proposal.save();

  const recipients = await User.find({ role: forwardTo, isActive: true }).select('_id').lean();
  if (recipients.length) {
    await Notification.insertMany(
      recipients.map((recipient: any) => ({
        userId: recipient._id,
        type: NOTIFICATION_TYPE.TEACHER_RESPONSE,
        title: 'A concern was forwarded to you',
        message: proposal.title,
        data: { proposalId: proposal._id.toString() },
      })),
    );
  }
  await audit('forward_proposal', { user, entityType: 'Proposal', entityId: id, metadata: { forwardTo } });
  return json(proposal.toObject());
}

async function review(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  if (!canReview(user.role)) throw new ApiError('You do not have permission to review this item', 403);
  const body = await ctx.body();
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new ApiError('Proposal not found', 404);
  proposal.events.push({
    action: 'under_review',
    actorId: user.sub,
    actorName: user.fullName || user.username,
    actorRole: user.role,
    note: body.note || 'Review started.',
    at: new Date(),
  });
  await proposal.save();
  return json(proposal.toObject());
}

async function resolve(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  if (!canReview(user.role) && !hasPermission(user, PERMISSIONS.RESOLUTIONS_UPDATE)) {
    throw new ApiError('You do not have permission to resolve this item', 403);
  }
  const body = await ctx.body();
  const note = requireString(body.note, 'Resolution note');
  const attachments = asArray(body.attachments);
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new ApiError('Proposal not found', 404);

  const resolution = await Resolution.create({
    proposalId: proposal._id,
    resolutionId: makeId('RES'),
    summary: note,
    actionPlan: body.actionPlan || note,
    resolvedBy: user.sub,
    resolvedByName: user.fullName || user.username,
    implementationStatus: 'completed',
    progressPercent: 100,
    resolvedAt: new Date(),
  });

  proposal.status = PROPOSAL_STATUS.RESOLVED;
  proposal.resolutionNote = note;
  proposal.resolvedByName = user.fullName || user.username;
  proposal.resolvedAt = new Date();
  proposal.resolutionId = resolution.resolutionId;
  proposal.proofAttachments = attachments;
  proposal.events.push({
    action: 'resolved',
    actorId: user.sub,
    actorName: user.fullName || user.username,
    actorRole: user.role,
    note,
    attachments,
    at: new Date(),
  });
  await proposal.save();

  await Notification.create({
    userId: proposal.createdBy,
    type: NOTIFICATION_TYPE.RESOLUTION_UPDATE,
    title: 'Your concern was marked resolved',
    message: proposal.title,
    data: { proposalId: proposal._id.toString(), resolutionId: resolution.resolutionId },
  });
  await audit('resolve', { user, entityType: 'Proposal', entityId: id });
  return json({ success: true, resolution: resolution.toObject(), proposal: proposal.toObject() });
}

async function escalate(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  if (!canReview(user.role) && !hasPermission(user, PERMISSIONS.PROPOSALS_ESCALATE)) {
    throw new ApiError('You do not have permission to escalate this item', 403);
  }
  const body = await ctx.body();
  const escalateTo = String(body.escalateTo || 'HOD');
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new ApiError('Proposal not found', 404);

  await Escalation.create({
    proposalId: proposal._id,
    fromRole: user.role,
    toRole: escalateTo,
    fromUserId: user.sub,
    reason: body.note || 'Escalated for higher authority review',
    note: body.note,
    status: 'pending',
    dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  proposal.status = PROPOSAL_STATUS.ESCALATED;
  proposal.escalatedTo = escalateTo;
  proposal.events.push({
    action: 'escalated',
    actorId: user.sub,
    actorName: user.fullName || user.username,
    actorRole: user.role,
    note: body.note || `Escalated to ${escalateTo}.`,
    at: new Date(),
  });
  await proposal.save();

  const recipients = await User.find({ role: escalateTo, isActive: true }).select('_id').lean();
  if (recipients.length) {
    await Notification.insertMany(
      recipients.map((recipient: any) => ({
        userId: recipient._id,
        type: NOTIFICATION_TYPE.ESCALATION,
        title: 'A concern was escalated to you',
        message: proposal.title,
        data: { proposalId: proposal._id.toString() },
      })),
    );
  }
  await audit('escalate', { user, entityType: 'Proposal', entityId: id, metadata: { escalateTo } });
  return json(proposal.toObject());
}

async function reject(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  if (!canManageProposals(user.role) && !canReview(user.role) && !hasPermission(user, PERMISSIONS.PROPOSALS_REVIEW)) {
    throw new ApiError('You do not have permission to reject this item', 403);
  }
  const body = await ctx.body();
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new ApiError('Proposal not found', 404);
  proposal.status = PROPOSAL_STATUS.REJECTED;
  proposal.events.push({
    action: 'rejected',
    actorId: user.sub,
    actorName: user.fullName || user.username,
    actorRole: user.role,
    note: body.note || 'Rejected.',
    at: new Date(),
  });
  await proposal.save();
  await Notification.create({
    userId: proposal.createdBy,
    type: NOTIFICATION_TYPE.TEACHER_RESPONSE,
    title: 'Your submission was closed',
    message: proposal.title,
    data: { proposalId: proposal._id.toString() },
  });
  await audit('reject_proposal', { user, entityType: 'Proposal', entityId: id });
  return json(proposal.toObject());
}

async function remove(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  const proposal = await Proposal.findById(id);
  if (!proposal) throw new ApiError('Proposal not found', 404);
  if (proposal.createdBy?.toString() !== user.sub && !isAuthority(user.role)) {
    throw new ApiError('You do not have permission to delete this item', 403);
  }
  await Promise.all([
    AnonymousBallot.deleteMany({ proposalId: proposal._id }),
    VotingAuthorization.deleteMany({ proposalId: proposal._id }),
    Notification.deleteMany({ 'data.proposalId': proposal._id.toString() }),
    Escalation.deleteMany({ proposalId: proposal._id }),
    Resolution.deleteMany({ proposalId: proposal._id }),
    ManagementReview.deleteMany({ proposalId: proposal._id }),
    Proposal.deleteOne({ _id: proposal._id }),
  ]);
  await audit('delete_proposal', { user, entityType: 'Proposal', entityId: id });
  return json({ success: true });
}

async function certify(ctx: RouteContext, id: string) {
  const user = await requireAuth(ctx.req);
  if (!isAuthority(user.role) && !hasPermission(user, PERMISSIONS.PROPOSALS_PUBLISH)) {
    throw new ApiError('You do not have permission to certify this item', 403);
  }
  if (!Types.ObjectId.isValid(id)) throw new ApiError('Invalid proposal id', 400);
  const proposal = await Proposal.findByIdAndUpdate(
    id,
    { $set: { status: PROPOSAL_STATUS.CERTIFIED, certifiedAt: new Date() }, $push: { events: { action: 'certified', actorId: user.sub, actorName: user.fullName || user.username, actorRole: user.role, at: new Date() } } },
    { new: true },
  );
  if (!proposal) throw new ApiError('Proposal not found', 404);
  return json(proposal.toObject());
}
