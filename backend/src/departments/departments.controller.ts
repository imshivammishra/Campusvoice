import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';

@Controller('departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private service: DepartmentsService) {}

  @Get()
  @RequiredPermissions('users:read')
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  @RequiredPermissions('institution:configure')
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @RequiredPermissions('institution:configure')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }
}
