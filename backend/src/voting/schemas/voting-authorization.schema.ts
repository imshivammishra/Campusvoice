import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VotingAuthorizationDocument = VotingAuthorization & Document;

@Schema({ timestamps: true })
export class VotingAuthorization {
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CRElection', required: true })
  electionId: Types.ObjectId;

  @Prop({ type: String })
  voterHash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Boolean, default: false })
  consumed: boolean;

  @Prop({ type: Date })
  consumedAt?: Date;
}

export const VotingAuthorizationSchema = SchemaFactory.createForClass(VotingAuthorization);
VotingAuthorizationSchema.index({ token: 1 }, { unique: true });
VotingAuthorizationSchema.index({ userId: 1, electionId: 1 }, { unique: true });
VotingAuthorizationSchema.index({ consumed: 1, expiresAt: 1 });
