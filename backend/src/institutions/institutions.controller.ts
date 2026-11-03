import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { InstitutionsService } from './institutions.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';

@Controller('institutions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InstitutionsController {
  constructor(private service: InstitutionsService) {}

  @Get()
  @RequiredPermissions('institution:configure')
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  @RequiredPermissions('institution:configure')
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get(':id')
  @RequiredPermissions('institution:configure')
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @RequiredPermissions('institution:configure')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @RequiredPermissions('institution:configure')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
