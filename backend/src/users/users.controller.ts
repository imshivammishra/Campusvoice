import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

function sanitizeUser(user: any) {
  if (!user) return user;
  const obj = typeof user.toObject === 'function' ? user.toObject() : user;
  const { passwordHash, refreshTokens, passwordResetToken, ...rest } = obj;
  return rest;
}

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private auditService: AuditService,
  ) {}

  @Get()
  @RequiredPermissions('users:read')
  async list(@Query() query: any) {
    const filter: any = {};
    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    if (query.search) {
      filter.$or = [
        { username: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { fullName: { $regex: query.search, $options: 'i' } },
      ];
    }
    return this.usersService.list(
      filter,
      parseInt(query.page || '1', 10),
      parseInt(query.limit || '20', 10),
    );
  }

  @Post()
  @RequiredPermissions('users:create')
  async create(
    @Body() body: any,
    @CurrentUser('sub') actingUserId: string,
  ) {
    const { password, ...rest } = body || {};
    const user = await this.usersService.create({
      ...rest,
      passwordHash: password || undefined,
      isActive: body?.isActive ?? true,
      isEmailVerified: true,
    });
    await this.auditService.log({
      userId: actingUserId,
      action: 'account_update',
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { type: 'account_created', role: body?.role },
    });
    return sanitizeUser(user);
  }

  @Post('bulk')
  @RequiredPermissions('users:create')
  async bulkCreate(
    @Body() body: any,
    @CurrentUser('sub') actingUserId: string,
  ) {
    const students = Array.isArray(body?.students) ? body.students : [];
    const results = await this.usersService.bulkCreateStudents(
      students,
      body?.defaults || {},
    );
    const created = results.filter((r) => r.ok).length;
    const failed = results.length - created;
    await this.auditService.log({
      userId: actingUserId,
      action: 'account_update',
      entityType: 'User',
      entityId: 'bulk',
      metadata: { type: 'bulk_student_import', created, failed },
    });
    return { results, created, failed };
  }

  @Get(':id')
  @RequiredPermissions('users:read')
  async getOne(@Param('id') id: string) {
    return sanitizeUser(await this.usersService.findById(id));
  }

  @Patch(':id/permissions')
  @RequiredPermissions('users:update')
  async updatePermissions(
    @Param('id') id: string,
    @Body() body: { permissions: string[] },
    @CurrentUser('sub') actingUserId: string,
  ) {
    const result = await this.usersService.updatePermissions(id, body.permissions);
    await this.auditService.log({
      userId: actingUserId,
      action: 'account_update',
      entityType: 'User',
      entityId: id,
      metadata: { type: 'permissions_updated' },
    });
    return sanitizeUser(result);
  }

  @Patch(':id/role')
  @RequiredPermissions('users:update')
  async updateRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @CurrentUser('sub') actingUserId: string,
  ) {
    const result = await this.usersService.updateRole(id, body.role);
    await this.auditService.log({
      userId: actingUserId,
      action: 'account_update',
      entityType: 'User',
      entityId: id,
      metadata: { type: 'role_updated', role: body.role },
    });
    return sanitizeUser(result);
  }

  @Patch(':id')
  @RequiredPermissions('users:update')
  async updateProfile(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('sub') actingUserId: string,
  ) {
    const result = await this.usersService.updateProfile(id, body);
    await this.auditService.log({
      userId: actingUserId,
      action: 'account_update',
      entityType: 'User',
      entityId: id,
      metadata: { type: 'profile_updated' },
    });
    return sanitizeUser(result);
  }

  @Patch(':id/deactivate')
  @RequiredPermissions('users:deactivate')
  async deactivate(
    @Param('id') id: string,
    @CurrentUser('sub') actingUserId: string,
  ) {
    const result = await this.usersService.deactivate(id);
    await this.usersService.revokeAllRefreshTokens(id);
    await this.auditService.log({
      userId: actingUserId,
      action: 'deactivate_account',
      entityType: 'User',
      entityId: id,
    });
    return sanitizeUser(result);
  }

  @Delete(':id')
  @RequiredPermissions('users:deactivate')
  async remove(
    @Param('id') id: string,
    @CurrentUser('sub') actingUserId: string,
  ) {
    if (actingUserId === id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const result = await this.usersService.hardDelete(id);
    await this.auditService.log({
      userId: actingUserId,
      action: 'deactivate_account',
      entityType: 'User',
      entityId: id,
      metadata: { type: 'account_deleted' },
    });
    return result;
  }

  @Patch(':id/activate')
  @RequiredPermissions('users:update')
  async activate(
    @Param('id') id: string,
    @CurrentUser('sub') actingUserId: string,
  ) {
    const result = await this.usersService.activate(id);
    await this.auditService.log({
      userId: actingUserId,
      action: 'account_update',
      entityType: 'User',
      entityId: id,
      metadata: { type: 'account_activated' },
    });
    return sanitizeUser(result);
  }

  @Post(':id/reset-password')
  @RequiredPermissions('users:credential-reset')
  async resetPassword(
    @Param('id') id: string,
    @CurrentUser('sub') actingUserId: string,
  ) {
    const temporaryPassword = await this.usersService.resetPasswordToTemporary(id);
    await this.auditService.log({
      userId: actingUserId,
      action: 'credential_reset',
      entityType: 'User',
      entityId: id,
      metadata: { type: 'admin_temporary_password' },
    });
    return {
      temporaryPassword,
      message:
        'Share this temporary password securely. The user must change it after signing in.',
    };
  }

  @Get('me/profile')
  async getProfile(@CurrentUser('sub') userId: string) {
    return sanitizeUser(await this.usersService.findById(userId));
  }
}
