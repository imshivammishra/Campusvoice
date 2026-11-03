import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { LoginSchema } from '@campusvoice/shared';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async login(usernameOrEmail: string, password: string, ip?: string, userAgent?: string) {
    if (typeof usernameOrEmail !== 'string' || typeof password !== 'string') {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = await this.usersService.findByUsernameOrEmail(usernameOrEmail);
    return this.completeLogin(user, password, ip, userAgent);
  }

  /**
   * Student login per spec: Student ID + institutional email + password.
   * The Student ID and email MUST belong to the same active account — a
   * Student ID from one account combined with another student's email fails.
   */
  async loginStudent(
    studentId: string,
    email: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ) {
    if (
      typeof studentId !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = await this.usersService.findByStudentId(studentId);
    if (
      !user ||
      !email ||
      (user.email || '').toLowerCase() !== email.toLowerCase()
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.completeLogin(user, password, ip, userAgent);
  }

  private async completeLogin(
    user: any,
    password: string,
    ip?: string,
    userAgent?: string,
  ) {
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new UnauthorizedException(
        `Account is locked until ${user.lockUntil.toISOString()}`,
      );
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (!isPasswordValid) {
      await this.usersService.incrementFailedAttempts(user._id.toString());
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await this.usersService.resetFailedAttempts(user._id.toString());
    await this.usersService.updateLastLogin(user._id.toString(), ip, userAgent);

    const tokens = await this.generateTokens(user);
    await this.usersService.saveRefreshToken(user._id.toString(), tokens.refreshToken);

    await this.auditService.log({
      userId: user._id.toString(),
      action: 'login',
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { ip, userAgent },
    });

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    await this.usersService.removeRefreshToken(userId, refreshToken);
    await this.auditService.log({
      userId,
      action: 'logout',
      entityType: 'User',
      entityId: userId,
    });
    return { success: true };
  }

  async refresh(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    const validToken = await this.usersService.hasRefreshToken(
      user._id.toString(),
      refreshToken,
    );
    if (!validToken) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    // Rotate refresh token
    await this.usersService.removeRefreshToken(user._id.toString(), refreshToken);
    const tokens = await this.generateTokens(user);
    await this.usersService.saveRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal whether email exists
      return { message: 'If an account exists, a reset link has been sent' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user._id.toString(), type: 'password-reset' },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '1h',
      },
    );

    await this.usersService.savePasswordResetToken(user._id.toString(), resetToken);

    // In production, send email here via notification service
    await this.auditService.log({
      userId: user._id.toString(),
      action: 'credential_reset',
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { type: 'password_reset_requested' },
    });

    return { message: 'If an account exists, a reset link has been sent' };
  }

  async confirmPasswordReset(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (payload.type !== 'password-reset') {
      throw new UnauthorizedException('Invalid reset token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await this.usersService.hasPasswordResetToken(
      user._id.toString(),
      token,
    );
    if (!valid) {
      throw new UnauthorizedException('Reset token already used or invalid');
    }

    const passwordHash = await argon2.hash(newPassword);
    await this.usersService.updatePassword(user._id.toString(), passwordHash);
    await this.usersService.consumePasswordResetToken(user._id.toString(), token);
    await this.usersService.revokeAllRefreshTokens(user._id.toString());

    await this.auditService.log({
      userId: user._id.toString(),
      action: 'credential_reset',
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { type: 'password_reset_confirmed' },
    });

    return { success: true };
  }

  async deactivateAccount(userId: string, actingUserId: string, reason?: string) {
    await this.usersService.deactivate(userId);
    await this.usersService.revokeAllRefreshTokens(userId);
    await this.auditService.log({
      userId: actingUserId,
      action: 'deactivate_account',
      entityType: 'User',
      entityId: userId,
      metadata: { reason },
    });
    return { success: true };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      institutionId: user.institutionId,
      departmentId: user.departmentId,
      classId: user.classId,
      type: 'access',
    };

    const refreshPayload = {
      sub: user._id.toString(),
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, resetToken, refreshTokens, ...rest } = user;
    return rest;
  }
}
