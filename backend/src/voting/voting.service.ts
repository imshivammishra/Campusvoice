import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import crypto from 'crypto';
import {
  AnonymousBallot,
  AnonymousBallotDocument,
} from './schemas/anonymous-ballot.schema';
import {
  VotingAuthorization,
  VotingAuthorizationDocument,
} from './schemas/voting-authorization.schema';
import { CRElectionDocument } from '../elections/schemas/cr-election.schema';
import { ElectionsService } from '../elections/elections.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class VotingService {
  constructor(
    @InjectModel(AnonymousBallot.name)
    private ballotModel: Model<AnonymousBallotDocument>,
    @InjectModel(VotingAuthorization.name)
    private authModel: Model<VotingAuthorizationDocument>,
    private electionsService: ElectionsService,
    private usersService: UsersService,
  ) {}

  async requestAuthorization(userId: string, electionId: string) {
    const election = await this.electionsService.findByElectionId(electionId);
    if (!election) throw new NotFoundException('Election not found');

    const now = new Date();
    if (election.status !== 'active') {
      throw new BadRequestException('Election is not active');
    }
    if (now < election.opensAt || now > election.closesAt) {
      throw new BadRequestException('Election is not currently open');
    }

    // Prevent duplicate authorization
    const existing = await this.authModel.findOne({ userId, electionId: election._id });
    if (existing) {
      if (existing.consumed) {
        throw new ConflictException('You have already voted in this election');
      }
      return { token: existing.token };
    }

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Create a voter hash - one-way, cannot reverse to identity
    const voterHash = crypto
      .createHash('sha256')
      .update(`${userId}:${electionId}:${process.env.JWT_ACCESS_SECRET}`)
      .digest('hex');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes to vote

    await this.authModel.create({
      token,
      userId,
      electionId: election._id,
      voterHash,
      expiresAt,
      consumed: false,
    });

    return { token };
  }

  async castVote(
    ballotId: string,
    choice: 'support' | 'oppose' | 'abstain',
    authorizationToken: string,
    ip?: string,
  ) {
    const auth = await this.authModel.findOne({ token: authorizationToken });
    if (!auth) {
      throw new UnauthorizedException('Invalid voting authorization');
    }
    if (auth.consumed) {
      throw new ConflictException('Voting authorization already consumed');
    }
    if (auth.expiresAt < new Date()) {
      throw new BadRequestException('Voting authorization expired');
    }

    const election = await this.electionsService.findByElectionId(
      auth.electionId.toString(),
    );
    if (!election) throw new NotFoundException('Election not found');
    if (election.status !== 'active') {
      throw new BadRequestException('Election is not active');
    }

    // Check for self-voting prevention
    const user = await this.usersService.findById(auth.userId.toString());
    if (user && user._id.toString() === ballotId) {
      throw new BadRequestException('Cannot vote for yourself');
    }

    const ballot = new this.ballotModel({
      ballotId: crypto.randomBytes(16).toString('hex'),
      electionId: auth.electionId,
      choice,
      voterHash: auth.voterHash,
      castAt: new Date(),
      ip,
    });

    await ballot.save();

    // Mark authorization consumed
    auth.consumed = true;
    auth.consumedAt = new Date();
    await auth.save();

    // Update candidate vote count if this is a CR election vote for a candidate
    // ballotId here is actually the candidate ID in CR elections
    // We'll update vote count in a separate step

    return { success: true, ballotId: ballot.ballotId };
  }

  async getResults(electionId: string) {
    const election = await this.electionsService.findByElectionId(electionId);
    if (!election) throw new NotFoundException('Election not found');

    const ballots = await this.ballotModel.find({ electionId: election._id }).lean();
    const totalVotes = ballots.length;
    const supportVotes = ballots.filter((b) => b.choice === 'support').length;
    const opposeVotes = ballots.filter((b) => b.choice === 'oppose').length;
    const abstainVotes = ballots.filter((b) => b.choice === 'abstain').length;

    const supportPercentage = totalVotes > 0 ? (supportVotes / totalVotes) * 100 : 0;
    const opposePercentage = totalVotes > 0 ? (opposeVotes / totalVotes) * 100 : 0;
    const participationRate = election.totalEligibleVoters > 0
      ? (totalVotes / election.totalEligibleVoters) * 100
      : 0;

    return {
      electionId,
      totalVotes,
      validVotes: totalVotes,
      supportVotes,
      opposeVotes,
      abstainVotes,
      supportPercentage: parseFloat(supportPercentage.toFixed(2)),
      opposePercentage: parseFloat(opposePercentage.toFixed(2)),
      abstainPercentage: totalVotes > 0 ? parseFloat((abstainVotes / totalVotes * 100).toFixed(2)) : 0,
      participationRate: parseFloat(participationRate.toFixed(2)),
      eligibleVoters: election.totalEligibleVoters,
      certified: election.status === 'certified',
      certifiedAt: election.certifiedAt,
    };
  }

  async hasVoted(userId: string, electionId: string): Promise<boolean> {
    const election = await this.electionsService.findByElectionId(electionId);
    if (!election) return false;
    const auth = await this.authModel.findOne({ userId, electionId: election._id });
    return !!auth?.consumed;
  }
}

class UnauthorizedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedException';
  }
}
