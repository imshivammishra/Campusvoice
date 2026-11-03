import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CRCandidateDocument = CRCandidate & Document;

@Schema({ timestamps: true })
export class CRCandidate {
  @Prop({ type: Types.ObjectId, ref: 'CRElection', required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  voteCount: number;

  @Prop({ default: false })
  isWithdrawn: boolean;

  @Prop({ type: Date })
  withdrawnAt?: Date;

  @Prop({ type: String })
  manifesto?: string;
}

export const CRCandidateSchema = SchemaFactory.createForClass(CRCandidate);
CRCandidateSchema.index({ electionId: 1 });
CRCandidateSchema.index({ electionId: 1, studentId: 1 }, { unique: true });
