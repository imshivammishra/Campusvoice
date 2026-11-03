import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CrMessageDocument = CrMessage & Document;

/**
 * A private message in a Student <-> current CR conversation. The conversation
 * is owned by a student (studentId). Only that student and the CR of the same
 * class may read it — other students never can.
 */
@Schema({ timestamps: true })
export class CrMessage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ index: true })
  className?: string;

  @Prop({ type: Types.ObjectId, ref: 'Class' })
  classId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  senderRole: string;

  @Prop({ required: true })
  senderName: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;
}

export const CrMessageSchema = SchemaFactory.createForClass(CrMessage);
CrMessageSchema.index({ studentId: 1, createdAt: 1 });
CrMessageSchema.index({ className: 1, createdAt: 1 });
