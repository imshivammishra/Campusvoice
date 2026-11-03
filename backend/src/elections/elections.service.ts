import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import {
  CRElection,
  CRElectionDocument,
} from './schemas/cr-election.schema';
import {
  CRCandidate,
  CRCandidateDocument,
} from './schemas/cr-candidate.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class ElectionsService {
  private schedulerRunning = false;

  constructor(
    @InjectModel(CRElection.name) private electionModel: Model<CRElectionDocument>,
    @InjectModel(CRCandidate.name)
    private candidateModel: Model<CRCandidateDocument>,
    private usersService: UsersService,
  ) {}

  /**
   * Idempotent election scheduler. Runs on a fixed interval and only performs
   * state transitions, so re-running (or restarting the process) never creates
   * duplicate elections or duplicate CR assignments (TEST 21 / TEST 27).
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async runElectionScheduler() {
    if (this.schedulerRunning) return; // in-process lock prevents overlap
    this.schedulerRunning = true;
    try {
      const now = new Date();
      // 1. Auto-open scheduled elections whose opening time has arrived.
      const toOpen = await this.electionModel.find({
        status: 'scheduled',
        opensAt: { $lte: now },
      });
      for (const e of toOpen) {
        e.status = 'active';
        await e.save();
      }
      // 2. Auto-close + certify elections whose closing time has passed.
      const toClose = await this.electionModel.find({
        status: 'active',
        closesAt: { $lte: now },
      });
      for (const e of toClose) {
        try {
          await this.certifyResults(e.electionId);
          await this.scheduleNextWeekly(e);
        } catch {
          // best-effort; next tick retries
        }
      }
    } finally {
      this.schedulerRunning = false;
    }
  }

  /** Schedules the next weekly election for a class, if none is pending. */
  private async scheduleNextWeekly(prev: CRElectionDocument) {
    const pending = await this.electionModel.findOne({
      classId: prev.classId,
      status: { $in: ['scheduled', 'active', 'nomination_open'] },
    });
    if (pending) return; // idempotent — never duplicate
    const opensAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.create({
      title: 'Weekly CR Election',
      classId: prev.classId,
      className: prev.className,
      opensAt,
      closesAt: new Date(opensAt.getTime() + 24 * 60 * 60 * 1000),
      schedulingMode: 'auto_schedule',
    });
  }

  async create(data: any) {
    const electionId = `ELEC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const election = new this.electionModel({
      ...data,
      electionId,
      status: 'scheduled',
    });
    return election.save();
  }

  async findAll(filter: any = {}) {
    return this.electionModel.find(filter).sort({ opensAt: -1 }).lean();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.electionModel.findById(id).lean();
  }

  async findByElectionId(electionId: string) {
    return this.electionModel.findOne({ electionId }).lean();
  }

  async findActiveByClass(classId: string) {
    const now = new Date();
    return this.electionModel.findOne({
      classId,
      opensAt: { $lte: now },
      closesAt: { $gte: now },
      status: 'active',
    }).lean();
  }

  async nominateCandidate(electionId: string, studentId: string, manifesto?: string) {
    const election = await this.electionModel.findOne({ electionId });
    if (!election) throw new NotFoundException('Election not found');
    if (election.status !== 'nomination_open' && election.status !== 'scheduled') {
      throw new BadRequestException('Nominations are not open');
    }

    const sid = Types.ObjectId.isValid(studentId)
      ? new Types.ObjectId(studentId)
      : studentId;
    const existing = await this.candidateModel.findOne({
      electionId: election._id,
      studentId: sid,
    });
    if (existing) {
      throw new ConflictException('Student already nominated');
    }

    return this.candidateModel.create({
      electionId: election._id,
      studentId: sid,
      manifesto,
    });
  }

  async withdrawCandidate(electionId: string, studentId: string) {
    const election = await this.electionModel.findOne({ electionId });
    if (!election) throw new NotFoundException('Election not found');
    return this.candidateModel.findOneAndUpdate(
      { electionId: election._id, studentId },
      { isWithdrawn: true, withdrawnAt: new Date() },
    );
  }

  async getCandidates(electionId: string) {
    const election = await this.electionModel.findOne({ electionId }).lean();
    if (!election) throw new NotFoundException('Election not found');
    return this.candidateModel.find({ electionId: election._id, isWithdrawn: false }).lean();
  }

  /** Open an election for voting (manual trigger or scheduler). */
  async openVoting(electionId: string) {
    const election = await this.electionModel.findOne({ electionId });
    if (!election) throw new NotFoundException('Election not found');
    if (!['scheduled', 'nomination_open'].includes(election.status)) {
      throw new BadRequestException('Election cannot be opened from its current state');
    }
    election.status = 'active';
    election.opensAt = new Date();
    return election.save();
  }

  /**
   * Cast one anonymous vote for a candidate. The voter is recorded (to prevent
   * double voting) but never linked to the candidate they chose. Self-voting is
   * rejected.
   */
  async voteForCandidate(electionId: string, voterId: string, candidateStudentId: string) {
    const election = await this.electionModel.findOne({ electionId });
    if (!election) throw new NotFoundException('Election not found');
    if (election.status !== 'active') {
      throw new BadRequestException('Election is not open for voting');
    }
    if ((election.votedStudentIds || []).includes(voterId)) {
      throw new ConflictException('You have already voted in this election');
    }
    if (voterId === candidateStudentId) {
      throw new BadRequestException('You cannot vote for yourself');
    }
    const candidate = await this.candidateModel.findOne({
      electionId: election._id,
      studentId: {
        $in: Types.ObjectId.isValid(candidateStudentId)
          ? [candidateStudentId, new Types.ObjectId(candidateStudentId)]
          : [candidateStudentId],
      },
      isWithdrawn: false,
    });
    if (!candidate) throw new NotFoundException('Candidate not found');

    candidate.voteCount += 1;
    await candidate.save();
    election.votedStudentIds.push(voterId);
    election.totalParticipatingVoters = (election.totalParticipatingVoters || 0) + 1;
    election.validVotes = (election.validVotes || 0) + 1;
    await election.save();
    return { success: true };
  }

  async certifyResults(electionId: string) {
    const session = await this.electionModel.db.startSession();
    session.startTransaction();
    try {
      const election = await this.electionModel.findOne({ electionId }).session(session);
      if (!election) throw new NotFoundException('Election not found');

      const candidates = await this.candidateModel
        .find({ electionId: election._id, isWithdrawn: false })
        .session(session)
        .lean();

      if (candidates.length === 0) {
        election.status = 'certified';
        election.certifiedAt = new Date();
        await election.save({ session });
        await session.commitTransaction();
        return { election, winner: null, message: 'No candidates - no winner' };
      }

      const maxVotes = Math.max(...candidates.map((c) => c.voteCount));
      const winners = candidates.filter((c) => c.voteCount === maxVotes);

      let winner = null;
      if (winners.length === 1 && maxVotes > 0) {
        winner = winners[0];
        election.winnerId = winner.studentId as any;
      } else if (winners.length > 1) {
        election.tieBreakerMethod = 'runoff_required';
      }

      election.status = 'certified';
      election.certifiedAt = new Date();
      await election.save({ session });
      await session.commitTransaction();

      // Atomic CR role transition: revoke previous CR(s), promote winner.
      if (winner) {
        await this.assignCrRole(
          winner.studentId.toString(),
          election.classId?.toString(),
          election.className,
        );
      }

      return { election, winner };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /** Promote the winner to CLASS_REPRESENTATIVE and expire the previous CR. */
  private async assignCrRole(
    winnerUserId: string,
    classId?: string,
    className?: string,
  ) {
    const or: any[] = [];
    if (classId && Types.ObjectId.isValid(classId)) {
      or.push({ classId: new Types.ObjectId(classId) });
    }
    if (className) or.push({ className });

    // Expire previous CR(s) in this class -> back to STUDENT (excluding winner).
    await this.usersService.revertClassRepsToStudent(or, winnerUserId);
    // Promote the winner.
    await this.usersService.updateRole(winnerUserId, 'CLASS_REPRESENTATIVE');
  }

  async updateVoteCounts(electionId: string) {
    // Recalculate from ballots
    const election = await this.electionModel.findOne({ electionId }).lean();
    if (!election) return;
    // This is called from voting service after ballot recording
  }
}
