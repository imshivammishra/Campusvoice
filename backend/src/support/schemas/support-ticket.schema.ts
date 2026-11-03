import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupportTicketDocument = SupportTicket & Document;

@Schema({ timestamps: true })
export class SupportTicket {
  @Prop({ required: true, unique: true })
  ticketId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo?: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: String, enum: ['public', 'confidential'], default: 'public' })
  confidentiality: string;

  @Prop({
    type: String,
    enum: ['open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'escalated'],
    default: 'open',
  })
  status: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Number, default: 0 })
  unreadCount: number;

  @Prop({ type: Date })
  responseDeadline?: Date;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
SupportTicketSchema.index({ ticketId: 1 }, { unique: true });
SupportTicketSchema.index({ createdBy: 1 });
SupportTicketSchema.index({ status: 1 });
