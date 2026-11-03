import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CRAssignmentDocument = CRAssignment & Document;

@Schema({ timestamps: true })
export class CRAssignment {
  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CRElection' })
  electionId?: Types.ObjectId;

  @Prop({ type: Date, required: true })
  termStartsAt: Date;

  @Prop({ type: Date, required: true })
  termEndsAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const CRAssignmentSchema = SchemaFactory.createForClass(CRAssignment);
CRAssignmentSchema.index({ classId: 1, isActive: 1 });
CRAssignmentSchema.index({ studentId: 1 });
CRAssignmentSchema.index({ termEndsAt: 1 });
