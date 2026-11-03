import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResolutionDocument = Resolution & Document;

@Schema({ timestamps: true })
export class Resolution {
  @Prop({ required: true, unique: true })
  resolutionId: string;

  @Prop({ type: Types.ObjectId, ref: 'Proposal' })
  proposalId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ManagementReview' })
  managementReviewId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Escalation' })
  escalationId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['open', 'in_progress', 'resolved', 'closed', 'rejected'] })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId;

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ type: String })
  implementationNotes?: string;
}

export const ResolutionSchema = SchemaFactory.createForClass(Resolution);
ResolutionSchema.index({ resolutionId: 1 }, { unique: true });
ResolutionSchema.index({ status: 1 });
