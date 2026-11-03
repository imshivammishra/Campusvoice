import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Proposal, ProposalDocument } from './schemas/proposal.schema';
import { UsersService } from '../users/users.service';
import { VotingService } from '../voting/voting.service';
import { NotificationsService } from '../notifications/notifications.service';

const AUTHORITY_ROLES = [
  'HOD',
  'PRINCIPAL',
  'REGISTRAR',
  'PRO_VICE_CHANCELLOR',
  'VICE_CHAIRMAN',
  'CHAIRMAN',
  'SUPER_ADMIN',
];

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name) private proposalModel: Model<ProposalDocument>,
    private usersService: UsersService,
    private votingService: VotingService,
    private notificationsService: NotificationsService,
  ) {}

  private async notify(
    userId: any,
    type: string,
    title: string,
    content: string,
  ) {
    try {
      if (!userId) return;
      await this.notificationsService.create({
        userId: userId.toString ? userId.toString() : userId,
        type,
        title,
        content,
      });
    } catch {
      // notifications are best-effort
    }
  }

  private has(user: any, perm: string): boolean {
    return Array.isArray(user?.permissions) && user.permissions.includes(perm);
  }

  private roleIn(user: any, roles: string[]): boolean {
    return roles.includes(user?.role || '');
  }

  private makeEvent(
    user: any,
    action: string,
    note?: string,
    attachments?: string[],
  ) {
    return {
      action,
      actorId: user?._id?.toString?.() || '',
      actorName: user?.fullName || user?.username || 'Unknown',
      actorRole: user?.role || '',
      note,
      attachments: attachments || [],
      at: new Date(),
    };
  }
  private isStudentRole(role?: string): boolean {
    return role === 'STUDENT' || role === 'CLASS_REPRESENTATIVE';
  }

  /** Whether a viewer may open a single item (detail/action). */
  private canSeeDetail(role: string | undefined, community: string): boolean {
    // The critical rule: student-community roles can NEVER see teacher concerns.
    if (community === 'teacher') return !this.isStudentRole(role);
    // Student-community concerns are visible to students (vote) and to
    // teachers/authorities (who handle forwarded/escalated reports).
    return true;
  }

  /** Builds the list (feed) community filter for a viewer. */
  private feedScope(role?: string): any {
    if (this.isStudentRole(role)) {
      return { community: 'student' };
    }
    if (role === 'TEACHER') {
      // Teacher feed: own teacher community + student concerns forwarded to them.
      return {
        $or: [
          { community: 'teacher' },
          {
            community: 'student',
            status: { $in: ['forwarded', 'escalated', 'resolved'] },
          },
        ],
      };
    }
    return {}; // authorities / super admin see everything
  }

  /** Removes voter-identity data so no one can see who voted. */
  private sanitize(p: any): any {
    if (!p) return p;
    const { votedUserIds, ...rest } = p;
    return rest;
  }

  async create(data: any, userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const role = user.role;

    // Community + authorization: only a CR publishes student-community
    // concerns; only teachers/authorities create teacher-community concerns.
    let community: string;
    if (role === 'TEACHER') {
      community = 'teacher';
    } else if (role === 'CLASS_REPRESENTATIVE') {
      community = 'student';
    } else if (this.roleIn(user, AUTHORITY_ROLES)) {
      community = data.community === 'teacher' ? 'teacher' : 'student';
    } else {
      throw new ForbiddenException(
        'Students cannot publish concerns. Only your elected Class Representative can publish student-community concerns — use "Message your CR" to suggest an issue.',
      );
    }

    const proposalId = `PROP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const proposal = new this.proposalModel({
      ...data,
      community,
      proposalId,
      createdBy: new Types.ObjectId(userId),
      raisedByName: user.fullName || user.username,
      raisedByRole: user.role,
      status: 'voting_active',
      votingOpenedAt: new Date(),
      supportVotes: 0,
      opposeVotes: 0,
      abstainVotes: 0,
      votedUserIds: [],
      events: [
        this.makeEvent(
          user,
          'raised',
          `Published by ${user.fullName || user.username} (${user.role})`,
        ),
        this.makeEvent(user, 'voting_opened', 'Opened for voting'),
      ],
      versionHistory: [
        {
          version: 1,
          title: data.title,
          description: data.description,
          modifiedAt: new Date(),
          modifiedBy: userId,
        },
      ],
    });
    const saved = await proposal.save();
    return this.sanitize(saved.toObject());
  }

  async findAll(
    filter: any = {},
    page = 1,
    limit = 50,
    viewer?: { role?: string; id?: string },
  ) {
    const scoped: any = { ...filter };
    if (viewer?.role) {
      // Server-side community isolation — enforced in the query itself.
      const scope = this.feedScope(viewer.role);
      Object.assign(scoped, scope);
      // Plain students only ever see published (non-draft) concerns.
      if (viewer.role === 'STUDENT' && !scoped.status) {
        scoped.status = { $ne: 'draft' };
      }
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.proposalModel.find(scoped).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.proposalModel.countDocuments(scoped),
    ]);
    return {
      data: data.map((p) => this.sanitize(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, viewer?: { role?: string; id?: string }): Promise<any> {
    if (!Types.ObjectId.isValid(id)) return null;
    const proposal = await this.proposalModel.findById(id).lean();
    if (!proposal) return null;
    // Community isolation: block students from teacher concerns (URL/IDOR).
    if (
      viewer?.role &&
      !this.canSeeDetail(viewer.role, proposal.community || 'student')
    ) {
      throw new ForbiddenException('You do not have access to this item');
    }
    const hasVoted = viewer?.id
      ? (proposal.votedUserIds || []).includes(viewer.id)
      : false;
    const isOwner = viewer?.id
      ? proposal.createdBy?.toString() === viewer.id
      : false;
    return { ...this.sanitize(proposal), hasVoted, isOwner };
  }

  async findByProposalId(proposalId: string) {
    return this.sanitize(await this.proposalModel.findOne({ proposalId }).lean());
  }

  private async load(id: string): Promise<ProposalDocument> {
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }

  async vote(id: string, userId: string, choice: string) {
    const valid = ['support', 'oppose', 'abstain'];
    if (!valid.includes(choice)) {
      throw new BadRequestException('Invalid vote choice');
    }
    const proposal = await this.load(id);
    if (proposal.status !== 'voting_active') {
      throw new BadRequestException('Voting is not open for this item');
    }
    if (proposal.createdBy.toString() === userId) {
      throw new BadRequestException('You cannot vote on your own submission');
    }
    if ((proposal.votedUserIds || []).includes(userId)) {
      throw new ConflictException('You have already voted');
    }
    proposal.votedUserIds.push(userId);
    if (choice === 'support') proposal.supportVotes += 1;
    else if (choice === 'oppose') proposal.opposeVotes += 1;
    else proposal.abstainVotes += 1;
    await proposal.save();
    return {
      success: true,
      supportVotes: proposal.supportVotes,
      opposeVotes: proposal.opposeVotes,
      abstainVotes: proposal.abstainVotes,
    };
  }

  async closeVoting(id: string, userId: string) {
    const user = await this.usersService.findById(userId);
    const canClose =
      user?.role === 'CLASS_REPRESENTATIVE' ||
      this.roleIn(user, AUTHORITY_ROLES) ||
      this.has(user, 'proposals:forward') ||
      this.has(user, 'proposals:publish');
    if (!canClose) {
      throw new ForbiddenException(
        'Only a Class Representative or authority can close voting',
      );
    }
    const proposal = await this.load(id);
    if (proposal.status !== 'voting_active') {
      throw new BadRequestException('Voting is not currently open');
    }
    proposal.status = 'voting_closed';
    proposal.votingClosedAt = new Date();
    proposal.events.push(
      this.makeEvent(
        user,
        'voting_closed',
        `Voting closed — Support ${proposal.supportVotes}, Oppose ${proposal.opposeVotes}, Abstain ${proposal.abstainVotes}`,
      ),
    );
    return this.sanitize((await proposal.save()).toObject());
  }

  async forward(id: string, userId: string, note?: string, forwardTo = 'TEACHER') {
    const user = await this.usersService.findById(userId);
    const canForward =
      user?.role === 'CLASS_REPRESENTATIVE' ||
      this.roleIn(user, AUTHORITY_ROLES) ||
      this.has(user, 'proposals:forward');
    if (!canForward) {
      throw new ForbiddenException(
        'Only a Class Representative or authorised user can forward this',
      );
    }
    const proposal = await this.load(id);
    if (!['voting_closed', 'voting_active'].includes(proposal.status)) {
      throw new BadRequestException('This item cannot be forwarded in its current state');
    }
    proposal.status = 'forwarded';
    proposal.forwardedTo = forwardTo;
    proposal.events.push(
      this.makeEvent(
        user,
        'forwarded',
        note || `Forwarded to ${forwardTo.toLowerCase()} for review`,
      ),
    );
    await this.notify(
      proposal.createdBy,
      'teacher_response',
      'Your concern was forwarded',
      `"${proposal.title}" has been forwarded to ${forwardTo.toLowerCase()} for review.`,
    );
    return this.sanitize((await proposal.save()).toObject());
  }

  async review(id: string, userId: string, note?: string) {
    const user = await this.usersService.findById(userId);
    const canReview =
      this.roleIn(user, ['TEACHER', ...AUTHORITY_ROLES]) ||
      this.has(user, 'proposals:review');
    if (!canReview) {
      throw new ForbiddenException('You are not authorised to review this item');
    }
    const proposal = await this.load(id);
    proposal.events.push(
      this.makeEvent(user, 'under_review', note || 'Taken up for review'),
    );
    return this.sanitize((await proposal.save()).toObject());
  }

  async resolve(id: string, userId: string, note: string, attachments: string[] = []) {
    const user = await this.usersService.findById(userId);
    const canResolve =
      this.roleIn(user, ['TEACHER', ...AUTHORITY_ROLES]) ||
      this.has(user, 'resolutions:update') ||
      this.has(user, 'proposals:review');
    if (!canResolve) {
      throw new ForbiddenException('You are not authorised to resolve this item');
    }
    if (!attachments || attachments.length === 0) {
      throw new BadRequestException(
        'Proof of resolution (an image or document) is required',
      );
    }
    const proposal = await this.load(id);
    proposal.status = 'resolved';
    proposal.resolutionNote = note;
    proposal.proofAttachments = attachments;
    proposal.resolvedByName = user?.fullName || user?.username;
    proposal.resolvedAt = new Date();
    proposal.events.push(
      this.makeEvent(user, 'resolved', note || 'Marked as resolved', attachments),
    );
    await this.notify(
      proposal.createdBy,
      'resolution_update',
      'Your concern was resolved',
      `"${proposal.title}" has been resolved by ${proposal.resolvedByName}. Proof attached.`,
    );
    return this.sanitize((await proposal.save()).toObject());
  }

  async escalate(id: string, userId: string, note?: string, escalateTo = 'HOD') {
    const user = await this.usersService.findById(userId);
    const canEscalate =
      this.roleIn(user, ['TEACHER', ...AUTHORITY_ROLES]) ||
      this.has(user, 'proposals:escalate') ||
      this.has(user, 'proposals:forward');
    if (!canEscalate) {
      throw new ForbiddenException('You are not authorised to escalate this item');
    }
    const proposal = await this.load(id);
    proposal.status = 'escalated';
    proposal.escalatedTo = escalateTo;
    proposal.events.push(
      this.makeEvent(
        user,
        'escalated',
        note || `Escalated to ${escalateTo} — cannot be resolved at this level`,
      ),
    );
    await this.notify(
      proposal.createdBy,
      'escalation',
      'Your concern was escalated',
      `"${proposal.title}" has been escalated to ${escalateTo} for higher-level action.`,
    );
    return this.sanitize((await proposal.save()).toObject());
  }

  async remove(id: string, userId: string) {
    const user = await this.usersService.findById(userId);
    const canDelete =
      this.roleIn(user, AUTHORITY_ROLES) || this.has(user, 'proposals:review');
    if (!canDelete) {
      throw new ForbiddenException('You are not authorised to delete this item');
    }
    const proposal = await this.load(id);
    await proposal.deleteOne();
    return { success: true };
  }

  async reject(id: string, userId: string, note?: string) {
    const user = await this.usersService.findById(userId);
    const canReject =
      this.roleIn(user, ['TEACHER', 'CLASS_REPRESENTATIVE', ...AUTHORITY_ROLES]) ||
      this.has(user, 'proposals:review');
    if (!canReject) {
      throw new ForbiddenException('You are not authorised to reject this item');
    }
    const proposal = await this.load(id);
    proposal.status = 'rejected';
    proposal.events.push(
      this.makeEvent(user, 'rejected', note || 'Rejected'),
    );
    return this.sanitize((await proposal.save()).toObject());
  }

  // Legacy endpoints retained for compatibility
  async publish(proposalId: string, userId: string) {
    const proposal = await this.load(proposalId);
    proposal.status = 'approved_for_voting';
    return this.sanitize((await proposal.save()).toObject());
  }

  async startVoting(id: string, userId: string) {
    const user = await this.usersService.findById(userId);
    const canStart =
      user?.role === 'CLASS_REPRESENTATIVE' ||
      this.roleIn(user, AUTHORITY_ROLES) ||
      this.has(user, 'proposals:publish') ||
      this.has(user, 'proposals:vote');
    if (!canStart) {
      throw new ForbiddenException(
        'Only a Class Representative or authority can start voting',
      );
    }
    const proposal = await this.load(id);
    if (!['draft', 'pending_review', 'approved_for_voting', 'voting_closed'].includes(proposal.status)) {
      throw new BadRequestException(
        'Voting can only be started for an item that is not already open or resolved',
      );
    }
    proposal.status = 'voting_active';
    proposal.votingOpenedAt = new Date();
    proposal.events.push(
      this.makeEvent(user, 'voting_opened', 'Voting started'),
    );
    return this.sanitize((await proposal.save()).toObject());
  }

  async certify(proposalId: string) {
    const proposal = await this.load(proposalId);
    proposal.status = 'certified';
    proposal.certifiedAt = new Date();
    return this.sanitize((await proposal.save()).toObject());
  }

  async updateVersion(proposalId: string, title: string, description: string, modifiedBy: string) {
    const proposal = await this.load(proposalId);
    const nextVersion = (proposal.versionHistory || []).length + 1;
    proposal.versionHistory.push({
      version: nextVersion,
      title,
      description,
      modifiedAt: new Date(),
      modifiedBy,
    });
    proposal.title = title;
    proposal.description = description;
    return this.sanitize((await proposal.save()).toObject());
  }
}
