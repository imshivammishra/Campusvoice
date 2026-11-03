import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RegistrationApproval,
  RegistrationApprovalDocument,
} from './schemas/registration-approval.schema';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '@campusvoice/shared';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectModel(RegistrationApproval.name)
    private registrationModel: Model<RegistrationApprovalDocument>,
    private usersService: UsersService,
    private auditService: AuditService,
  ) {}

  async create(data: any) {
    const existing = await this.registrationModel.findOne({
      $or: [{ email: data.email }, { username: data.username }],
    });
    if (existing) {
      throw new ConflictException('Email or username already registered');
    }

    const reference = `REG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const registration = new this.registrationModel({
      ...data,
      reference,
      status: 'pending',
    });
    return registration.save();
  }

  async findAll(filter: any = {}) {
    return this.registrationModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.registrationModel.findById(id).lean();
  }

  async approve(
    id: string,
    reviewerId: string,
    notes?: string,
  ) {
    const registration = await this.registrationModel.findById(id);
    if (!registration) {
      throw new NotFoundException('Registration not found');
    }
    if (registration.status !== 'pending') {
      throw new BadRequestException('Registration already processed');
    }

    // Create the actual user account
    const userData: any = {
      username: registration.username,
      email: registration.email,
      fullName: registration.fullName,
      role: registration.role,
      permissions: this.getDefaultPermissions(registration.role),
      institutionId: registration.institutionId,
      departmentId: registration.departmentId,
      classId: registration.classId,
      studentId: registration.studentId,
      employeeId: registration.employeeId,
      course: registration.course,
      academicYear: registration.academicYear,
      semester: registration.semester,
      className: registration.className,
      section: registration.section,
      phone: registration.phone,
      designation: registration.designation,
      authorityId: registration.authorityId,
      appointmentDetails: registration.appointmentDetails,
      isActive: true,
      isEmailVerified: true,
      cannotChangeUsername: registration.role === 'STUDENT',
      cannotChangePassword: registration.role === 'STUDENT',
    };

    // Use a placeholder password - user must set via reset
    const user = await this.usersService.create({
      ...userData,
      passwordHash: 'temporary',
    });

    registration.status = 'approved';
    registration.reviewedBy = new Types.ObjectId(reviewerId);
    registration.reviewedAt = new Date();
    registration.reviewNotes = notes;
    registration.approvedUserId = user._id;
    await registration.save();

    await this.auditService.log({
      userId: reviewerId,
      action: 'approve_registration',
      entityType: 'RegistrationApproval',
      entityId: id,
      metadata: { role: registration.role, approvedUserId: user._id.toString() },
    });

    return { registration, user };
  }

  async reject(id: string, reviewerId: string, notes?: string) {
    const registration = await this.registrationModel.findById(id);
    if (!registration) {
      throw new NotFoundException('Registration not found');
    }
    registration.status = 'rejected';
    registration.reviewedBy = new Types.ObjectId(reviewerId);
    registration.reviewedAt = new Date();
    registration.reviewNotes = notes;
    await registration.save();

    await this.auditService.log({
      userId: reviewerId,
      action: 'approve_registration',
      entityType: 'RegistrationApproval',
      entityId: id,
      metadata: { status: 'rejected', notes },
    });

    return registration;
  }

  private getDefaultPermissions(role: string): string[] {
    const base: string[] = [];
    if (role === 'STUDENT') {
      base.push('elections:vote', 'proposals:vote');
    }
    if (role === 'TEACHER') {
      base.push('proposals:create', 'proposals:vote');
    }
    return base;
  }
}
