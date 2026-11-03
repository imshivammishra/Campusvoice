import { Controller, Get, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';

@Controller('teachers')
@UseGuards(JwtAuthGuard)
export class TeachersController {
  constructor(private service: TeachersService) {}

  @Get('dashboard')
  async dashboard() {
    return this.service.getDashboardData();
  }
}
