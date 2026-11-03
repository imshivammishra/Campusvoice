import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private service: PermissionsService) {}

  @Get()
  @RequiredPermissions('users:read')
  async getAll() {
    return this.service.getAll();
  }

  @Get('matrix')
  @RequiredPermissions('audit:read')
  async getMatrix() {
    return this.service.getMatrix();
  }
}
