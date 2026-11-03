import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnonymousBallotDocument = AnonymousBallot & Document;

@Schema({ timestamps: true })
export class AnonymousBallot {
  @Prop({ required: true, unique: true })
  ballotId: string;

  @Prop({ type: Types.ObjectId, ref: 'CRElection', required: true })
  electionId: Types.ObjectId;

  @Prop({ type: String, enum: ['support', 'oppose', 'abstain'], required: true })
  choice: string;

  @Prop({ type: String })
  voterHash: string; // Hashed voter identifier for duplicate prevention, not reversible to identity

  @Prop({ type: Date })
  castAt: Date;

  @Prop({ type: String })
  ip?: string;

  // No user identity stored here - privacy by design
}

export const AnonymousBallotSchema = SchemaFactory.createForClass(AnonymousBallot);
AnonymousBallotSchema.index({ electionId: 1 });
AnonymousBallotSchema.index({ ballotId: 1 }, { unique: true });
AnonymousBallotSchema.index({ voterHash: 1, electionId: 1 }, { unique: true });
