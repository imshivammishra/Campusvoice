import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProposalDocument = Proposal & Document;

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ required: true, unique: true })
  proposalId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  crId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  department: string;

  @Prop({
    type: String,
    enum: ['student', 'teacher'],
    default: 'student',
    index: true,
  })
  community: string;

  @Prop({ type: Types.ObjectId, ref: 'Class' })
  classId?: Types.ObjectId;

  @Prop()
  proposedSolution?: string;

  @Prop({ type: [String], default: [] })
  supportingEvidence: string[];

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({
    type: String,
    enum: ['public', 'class', 'department', 'confidential'],
    default: 'public',
  })
  confidentiality: string;

  @Prop({
    type: String,
    enum: ['draft', 'pending_review', 'approved_for_voting', 'voting_active', 'voting_closed', 'certified', 'forwarded', 'escalated', 'resolved', 'rejected', 'cancelled'],
    default: 'draft',
  })
  status: string;

  @Prop({
    type: String,
    enum: ['student', 'teacher', 'institution', 'class', 'department'],
    default: 'student',
  })
  audienceType: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  targetRoleId?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  supportVotes: number;

  @Prop({ type: Number, default: 0 })
  opposeVotes: number;

  @Prop({ type: Number, default: 0 })
  abstainVotes: number;

  @Prop({ type: [String], default: [] })
  votedUserIds: string[];

  @Prop({ type: String })
  raisedByName?: string;

  @Prop({ type: String })
  raisedByRole?: string;

  @Prop({
    type: [
      {
        action: String,
        actorId: String,
        actorName: String,
        actorRole: String,
        note: String,
        attachments: [String],
        at: Date,
      },
    ],
    default: [],
  })
  events: Array<{
    action: string;
    actorId: string;
    actorName: string;
    actorRole: string;
    note?: string;
    attachments?: string[];
    at: Date;
  }>;

  @Prop({ type: [String], default: [] })
  proofAttachments: string[];

  @Prop({ type: String })
  resolutionNote?: string;

  @Prop({ type: String })
  resolvedByName?: string;

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ type: Date })
  votingOpenedAt?: Date;

  @Prop({ type: Date })
  votingClosedAt?: Date;

  @Prop({ type: Date })
  certifiedAt?: Date;

  @Prop({ type: String })
  forwardedTo?: string;

  @Prop({ type: String })
  escalatedTo?: string;

  @Prop({ type: String })
  resolutionId?: string;

  @Prop({ type: [{ version: Number, title: String, description: String, modifiedAt: Date, modifiedBy: String }], default: [] })
  versionHistory: Array<{
    version: number;
    title: string;
    description: string;
    modifiedAt: Date;
    modifiedBy: string;
  }>;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);
ProposalSchema.index({ proposalId: 1 }, { unique: true });
ProposalSchema.index({ createdBy: 1 });
ProposalSchema.index({ status: 1 });
ProposalSchema.index({ classId: 1, status: 1 });
ProposalSchema.index({ department: 1, status: 1 });
ProposalSchema.index({ type: 1 });
