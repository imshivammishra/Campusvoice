import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private service: AuditService) {}

  @Get()
  @RequiredPermissions('audit:read')
  async findAll(@Query() query: any) {
    return this.service.findAll(
      {},
      parseInt(query.page || '1', 10),
      parseInt(query.limit || '50', 10),
    );
  }
}
