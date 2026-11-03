import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ManagementReviewDocument = ManagementReview & Document;

@Schema({ timestamps: true })
export class ManagementReview {
  @Prop({ required: true, unique: true })
  reviewId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  subjectUserId?: Types.ObjectId;

  @Prop({ required: true })
  targetAuthority: string;

  @Prop({ type: [String], default: [] })
  votingGroups: string[];

  @Prop({
    type: String,
    enum: ['draft', 'pending_review', 'voting_active', 'certified', 'forwarded', 'resolved', 'rejected'],
    default: 'draft',
  })
  status: string;

  @Prop({ type: Date })
  responseDeadline?: Date;

  @Prop({ type: String })
  response?: string;

  @Prop({ type: Date })
  respondedAt?: Date;
}

export const ManagementReviewSchema = SchemaFactory.createForClass(ManagementReview);
ManagementReviewSchema.index({ reviewId: 1 }, { unique: true });
ManagementReviewSchema.index({ createdBy: 1 });
ManagementReviewSchema.index({ status: 1 });
