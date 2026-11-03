import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(userData: Partial<User>) {
    const existing = await this.userModel.findOne({
      $or: [{ username: userData.username }, { email: userData.email }],
    });
    if (existing) {
      throw new ConflictException('Username or email already exists');
    }

    if (userData.studentId) {
      const existingStudent = await this.userModel.findOne({
        studentId: userData.studentId,
      });
      if (existingStudent) {
        throw new ConflictException('Student ID already exists');
      }
    }

    if (userData.employeeId) {
      const existingEmployee = await this.userModel.findOne({
        employeeId: userData.employeeId,
      });
      if (existingEmployee) {
        throw new ConflictException('Employee ID already exists');
      }
    }

    let passwordHash = userData.passwordHash || '';
    // Only hash if not already hashed (argon2 hashes start with $argon2)
    if (!passwordHash.startsWith('$argon2')) {
      passwordHash = await argon2.hash(passwordHash);
    }
    const user = new this.userModel({
      ...userData,
      passwordHash,
      isActive: userData.isActive ?? false, // Requires approval by default
      isEmailVerified: userData.isEmailVerified ?? false,
      failedLoginAttempts: 0,
      refreshTokens: [],
      cannotChangeUsername: userData.role === 'STUDENT',
      cannotChangePassword: userData.role === 'STUDENT',
    });
    return user.save();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.userModel.findById(id).lean();
  }

  async findByUsernameOrEmail(usernameOrEmail: string) {
    return this.userModel
      .findOne({
        $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      })
      .lean();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).lean();
  }

  async findByStudentId(studentId: string) {
    return this.userModel.findOne({ studentId }).lean();
  }

  async findByUsername(username: string) {
    return this.userModel.findOne({ username }).lean();
  }

  async incrementFailedAttempts(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) return;
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const update: any = { failedLoginAttempts: attempts };
    if (attempts >= 5) {
      update.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }
    await this.userModel.findByIdAndUpdate(userId, update);
  }

  async resetFailedAttempts(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      failedLoginAttempts: 0,
      lockUntil: null,
    });
  }

  async updateLastLogin(userId: string, ip?: string, userAgent?: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
    });
  }

  async saveRefreshToken(userId: string, refreshToken: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.userModel.findByIdAndUpdate(userId, {
      $push: { refreshTokens: { token: refreshToken, expiresAt } },
    });
  }

  async hasRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) return false;
    return user.refreshTokens?.some((t) => t.token === refreshToken) || false;
  }

  async removeRefreshToken(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.userModel.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: { token: refreshToken } },
      });
    } else {
      await this.userModel.findByIdAndUpdate(userId, { refreshTokens: [] });
    }
  }

  async revokeAllRefreshTokens(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokens: [] });
  }

  async savePasswordResetToken(userId: string, token: string) {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.userModel.findByIdAndUpdate(userId, {
      passwordResetToken: token,
      passwordResetExpires: expiresAt,
    });
  }

  async hasPasswordResetToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) return false;
    return Boolean(
      user.passwordResetToken === token &&
        user.passwordResetExpires &&
        user.passwordResetExpires > new Date(),
    );
  }

  async consumePasswordResetToken(userId: string, token: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    await this.userModel.findByIdAndUpdate(userId, { passwordHash });
  }

  /**
   * Generates a secure temporary password, applies it, and revokes all active
   * sessions. Returns the plaintext temporary password so an authority can
   * relay it once — administrators can never retrieve an existing password.
   */
  async resetPasswordToTemporary(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const tempPassword = this.generateTemporaryPassword();
    const passwordHash = await argon2.hash(tempPassword);
    await this.userModel.findByIdAndUpdate(userId, {
      passwordHash,
      refreshTokens: [],
      failedLoginAttempts: 0,
      lockUntil: null,
    });
    return tempPassword;
  }

  private generateTemporaryPassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%&*';
    const all = upper + lower + digits + symbols;
    const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
    let pwd = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
    for (let i = 0; i < 8; i++) pwd += pick(all);
    return pwd;
  }

  private slugUsername(fullName: string): string {
    const parts = fullName
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const base = parts.slice(0, 2).join('.') || 'student';
    const suffix = Math.floor(100 + Math.random() * 900);
    return `${base}.${suffix}`;
  }

  /**
   * Creates many student accounts at once. Each created account is returned
   * with its generated username and plaintext temporary password so an
   * authority can distribute credentials. Rows that fail (e.g. duplicates) are
   * reported individually without aborting the whole batch.
   */
  async bulkCreateStudents(
    rows: any[],
    defaults: any = {},
  ): Promise<
    Array<{
      ok: boolean;
      fullName?: string;
      username?: string;
      email?: string;
      password?: string;
      studentId?: string;
      error?: string;
    }>
  > {
    const results = [];
    for (const row of rows || []) {
      const fullName = String(row.fullName || '').trim();
      if (!fullName) {
        results.push({ ok: false, error: 'Missing full name' });
        continue;
      }
      const studentId = String(row.studentId || '').trim() || undefined;
      let username =
        String(row.username || '').trim() ||
        (studentId ? studentId.toLowerCase() : this.slugUsername(fullName));
      const email =
        String(row.email || '').trim() ||
        `${username}@students.campusvoice.local`;
      const password = String(row.password || '').trim() || this.generateTemporaryPassword();

      try {
        const user = await this.create({
          fullName,
          username,
          email,
          role: 'STUDENT',
          passwordHash: password,
          permissions: ['elections:vote', 'proposals:vote'],
          studentId,
          className: String(row.className || defaults.className || '').trim() || undefined,
          section: String(row.section || defaults.section || '').trim() || undefined,
          course: String(row.course || defaults.course || '').trim() || undefined,
          isActive: true,
          isEmailVerified: true,
        } as any);
        results.push({
          ok: true,
          fullName,
          username,
          email,
          password,
          studentId,
          id: user._id.toString(),
        } as any);
      } catch (e: any) {
        results.push({
          ok: false,
          fullName,
          username,
          studentId,
          error: e?.message || 'Failed to create account',
        });
      }
    }
    return results;
  }

  async deactivate(userId: string) {
    return this.userModel.findByIdAndUpdate(userId, { isActive: false });
  }

  /**
   * Permanently delete a user and cascade their personal data.
   * Super administrator accounts are protected and can never be deleted.
   */
  async hardDelete(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('User not found');
    }
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Super administrator accounts cannot be deleted',
      );
    }
    const oid = new Types.ObjectId(userId);
    const db = this.userModel.db;

    // Cascade the user's own content so no orphaned personal data remains.
    const tickets = await db
      .collection('supporttickets')
      .find({ createdBy: oid })
      .project({ _id: 1 })
      .toArray();
    const ticketIds = tickets.map((t) => t._id);

    await Promise.all([
      db.collection('crmessages').deleteMany({ studentId: oid }),
      db
        .collection('notifications')
        .deleteMany({ userId: { $in: [userId, oid] } }),
      db.collection('supportmessages').deleteMany({ senderId: oid }),
      ticketIds.length
        ? db
            .collection('supportmessages')
            .deleteMany({ ticketId: { $in: ticketIds } })
        : Promise.resolve(),
      ticketIds.length
        ? db.collection('supporttickets').deleteMany({ _id: { $in: ticketIds } })
        : Promise.resolve(),
    ]);

    await user.deleteOne();
    return { success: true, deletedUserId: userId };
  }

  async activate(userId: string) {
    return this.userModel.findByIdAndUpdate(userId, { isActive: true, isEmailVerified: true });
  }

  async updatePermissions(userId: string, permissions: string[]) {
    return this.userModel.findByIdAndUpdate(userId, { permissions });
  }

  async updateRole(userId: string, role: string) {
    return this.userModel.findByIdAndUpdate(userId, { role });
  }

  /** Update editable profile fields (used by admin Manage modal). */
  async updateProfile(userId: string, fields: any) {
    const allowed: any = {};
    for (const key of [
      'fullName',
      'email',
      'phone',
      'className',
      'studentId',
      'employeeId',
    ]) {
      if (fields[key] !== undefined) allowed[key] = fields[key];
    }
    return this.userModel.findByIdAndUpdate(userId, allowed, { new: true });
  }

  /** Reverts current Class Representatives in a class back to STUDENT. */
  async revertClassRepsToStudent(classScope: any[], exceptUserId?: string) {
    if (!classScope || classScope.length === 0) return;
    const filter: any = {
      role: 'CLASS_REPRESENTATIVE',
      $or: classScope,
    };
    if (exceptUserId && Types.ObjectId.isValid(exceptUserId)) {
      filter._id = { $ne: new Types.ObjectId(exceptUserId) };
    }
    await this.userModel.updateMany(filter, { role: 'STUDENT' });
  }

  async list(filter: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async addRoleAssignment(userId: string, role: string) {
    return this.userModel.findByIdAndUpdate(userId, { $addToSet: { roles: role } });
  }

  async removeRoleAssignment(userId: string, role: string) {
    return this.userModel.findByIdAndUpdate(userId, { $pull: { roles: role } });
  }
}
