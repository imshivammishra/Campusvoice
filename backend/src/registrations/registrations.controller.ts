import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('registrations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RegistrationsController {
  constructor(private service: RegistrationsService) {}

  @Post()
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get()
  @RequiredPermissions('users:read')
  async findAll(@Query() query: any) {
    return this.service.findAll({ status: query.status || 'pending' });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id/approve')
  @RequiredPermissions('users:create')
  async approve(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentUser('sub') reviewerId: string,
  ) {
    return this.service.approve(id, reviewerId, body.notes);
  }

  @Patch(':id/reject')
  @RequiredPermissions('users:create')
  async reject(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentUser('sub') reviewerId: string,
  ) {
    return this.service.reject(id, reviewerId, body.notes);
  }
}
