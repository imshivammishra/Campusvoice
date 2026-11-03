import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CRElectionDocument = CRElection & Document;

@Schema({ timestamps: true })
export class CRElection {
  @Prop({ required: true, unique: true })
  electionId: string;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop({ index: true })
  className?: string;

  @Prop({ type: [String], default: [] })
  votedStudentIds: string[];

  @Prop({ required: true })
  title: string;

  @Prop({ type: Date, required: true })
  opensAt: Date;

  @Prop({ type: Date, required: true })
  closesAt: Date;

  @Prop({ type: Date })
  nominationOpensAt: Date;

  @Prop({ type: Date })
  nominationClosesAt: Date;

  @Prop({
    type: String,
    enum: ['scheduled', 'nomination_open', 'active', 'closed', 'certified', 'cancelled'],
    default: 'scheduled',
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  totalEligibleVoters: number;

  @Prop({ type: Number, default: 0 })
  totalParticipatingVoters: number;

  @Prop({ type: Number, default: 0 })
  validVotes: number;

  @Prop({ type: Number, default: 0 })
  invalidBallots: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  winnerId?: Types.ObjectId;

  @Prop({ type: Date })
  certifiedAt?: Date;

  @Prop({ type: String })
  tieBreakerMethod?: string;

  @Prop({ type: String, enum: ['none', 'auto_schedule', 'manual'] })
  schedulingMode: string;

  @Prop({ type: Date })
  nextElectionAt?: Date;
}

export const CRElectionSchema = SchemaFactory.createForClass(CRElection);
CRElectionSchema.index({ classId: 1, status: 1 });
CRElectionSchema.index({ electionId: 1 }, { unique: true });
CRElectionSchema.index({ opensAt: 1, closesAt: 1 });
CRElectionSchema.index({ status: 1 });
