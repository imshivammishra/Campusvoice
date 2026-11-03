import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('stats')
  @RequiredPermissions('audit:read')
  async stats() {
    return this.service.getSystemStats();
  }

  @Post('reset')
  @RequiredPermissions('users:deactivate')
  async reset() {
    return this.service.purgeAllData();
  }
}
