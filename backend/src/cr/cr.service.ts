import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { CRAssignment, CRAssignmentDocument } from './schemas/cr-assignment.schema';
import { UsersService } from '../users/users.service';
import { ROLES } from '@campusvoice/shared';

@Injectable()
export class CrService {
  constructor(
    @InjectModel(CRAssignment.name)
    private crAssignmentModel: Model<CRAssignmentDocument>,
    private usersService: UsersService,
  ) {}

  async assignCR(
    classId: string,
    studentId: string,
    electionId?: string,
    termEndsAt?: Date,
  ) {
    const session = await this.crAssignmentModel.db.startSession();
    session.startTransaction();
    try {
      // Revoke previous active CR for this class
      await this.crAssignmentModel.updateMany(
        { classId: new Types.ObjectId(classId), isActive: true },
        { isActive: false },
        { session },
      );

      // Revoke CR role from previous student
      // (handled by finding previous CRs)
      const previous = await this.crAssignmentModel
        .findOne({ classId: new Types.ObjectId(classId), isActive: true })
        .session(session);

      // Assign new CR
      const assignment = new this.crAssignmentModel({
        classId: new Types.ObjectId(classId),
        studentId: new Types.ObjectId(studentId),
        electionId: electionId ? new Types.ObjectId(electionId) : undefined,
        termStartsAt: new Date(),
        termEndsAt: termEndsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
      });
      await assignment.save({ session });

      // Grant CR role to student
      await this.usersService.updateRole(studentId, ROLES.CLASS_REPRESENTATIVE);
      await this.usersService.updatePermissions(studentId, [
        'proposals:create',
        'proposals:forward',
        'proposals:publish',
      ]);

      // Revoke CR role from previous CR if different
      if (previous && previous.studentId.toString() !== studentId) {
        await this.usersService.updateRole(previous.studentId.toString(), ROLES.STUDENT);
        await this.usersService.updatePermissions(previous.studentId.toString(), [
          'elections:vote',
          'proposals:vote',
        ]);
      }

      await session.commitTransaction();
      return assignment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getActiveCR(classId: string) {
    const now = new Date();
    return this.crAssignmentModel
      .findOne({ classId: new Types.ObjectId(classId), isActive: true, termEndsAt: { $gte: now } })
      .lean();
  }

  async getHistory(classId: string) {
    return this.crAssignmentModel
      .find({ classId: new Types.ObjectId(classId) })
      .sort({ termStartsAt: -1 })
      .lean();
  }

  async revokeExpiredCRs() {
    const now = new Date();
    const expired = await this.crAssignmentModel
      .find({ isActive: true, termEndsAt: { $lt: now } })
      .lean();

    for (const cr of expired) {
      cr.isActive = false;
      await this.crAssignmentModel.findByIdAndUpdate(cr._id, { isActive: false });
      await this.usersService.updateRole(cr.studentId.toString(), ROLES.STUDENT);
      await this.usersService.updatePermissions(cr.studentId.toString(), [
        'elections:vote',
        'proposals:vote',
      ]);
    }

    return { revoked: expired.length };
  }
}
