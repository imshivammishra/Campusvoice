import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ROLES } from '@campusvoice/shared';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true },
})
export class User {
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, enum: Object.values(ROLES) })
  role: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Types.ObjectId, ref: 'Institution', index: true })
  institutionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department', index: true })
  departmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Class', index: true })
  classId?: Types.ObjectId;

  @Prop({ index: true })
  studentId?: string;

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

  @Prop({ index: true })
  employeeId?: string;

  @Prop()
  designation?: string;

  @Prop()
  authorityId?: string;

  @Prop()
  appointmentDetails?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: Date })
  emailVerifiedAt?: Date;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ type: Number, default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date })
  lockUntil?: Date;

  @Prop({ type: String })
  passwordResetToken?: string;

  @Prop({ type: Date })
  passwordResetExpires?: Date;

  @Prop({ type: [{ token: String, expiresAt: Date }], default: [] })
  refreshTokens: Array<{ token: string; expiresAt: Date }>;

  @Prop({ type: Boolean, default: false })
  cannotChangeUsername: boolean;

  @Prop({ type: Boolean, default: false })
  cannotChangePassword: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ studentId: 1 }, { unique: true, partialFilterExpression: { studentId: { $exists: true } } });
UserSchema.index({ employeeId: 1 }, { unique: true, partialFilterExpression: { employeeId: { $exists: true } } });
