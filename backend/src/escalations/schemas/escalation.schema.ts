import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EscalationDocument = Escalation & Document;

@Schema({ timestamps: true })
export class Escalation {
  @Prop({ required: true, unique: true })
  escalationId: string;

  @Prop({ type: Types.ObjectId, ref: 'Proposal', required: true })
  proposalId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  fromAuthority: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  toAuthority: Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: [String], default: [] })
  evidence: string[];

  @Prop({ type: Date })
  responseDeadline?: Date;

  @Prop({ type: String })
  response?: string;

  @Prop({ type: Date })
  respondedAt?: Date;
}

export const EscalationSchema = SchemaFactory.createForClass(Escalation);
EscalationSchema.index({ escalationId: 1 }, { unique: true });
EscalationSchema.index({ proposalId: 1 });
EscalationSchema.index({ fromAuthority: 1 });
EscalationSchema.index({ toAuthority: 1 });
