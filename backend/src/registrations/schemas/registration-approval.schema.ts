import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ROLES } from '@campusvoice/shared';

export type RegistrationApprovalDocument = RegistrationApproval & Document;

@Schema({ timestamps: true })
export class RegistrationApproval {
  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true, enum: Object.values(ROLES) })
  role: string;

  @Prop()
  studentId?: string;

  @Prop()
  employeeId?: string;

  @Prop()
  authorityId?: string;

  @Prop()
  department?: string;

  @Prop()
  designation?: string;

  @Prop()
  institution?: string;

  @Prop()
  appointmentDetails?: string;

  @Prop({ required: true })
  status: 'pending' | 'approved' | 'rejected';

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop()
  reviewNotes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedUserId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Institution' })
  institutionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Class' })
  classId?: Types.ObjectId;

  @Prop()
  course?: string;

  @Prop({ type: Number })
  academicYear?: number;

  @Prop({ type: Number })
  semester?: number;

  @Prop()
  className?: string;

  @Prop()
  section?: string;

  @Prop()
  phone?: string;
}

export const RegistrationApprovalSchema = SchemaFactory.createForClass(RegistrationApproval);
RegistrationApprovalSchema.index({ email: 1 }, { unique: true });
RegistrationApprovalSchema.index({ username: 1 }, { unique: true });
RegistrationApprovalSchema.index({ status: 1 });
RegistrationApprovalSchema.index({ role: 1 });
