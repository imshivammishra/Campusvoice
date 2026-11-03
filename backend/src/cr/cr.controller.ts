import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CrService } from './cr.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';

@Controller('cr')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrController {
  constructor(private service: CrService) {}

  @Post('assign')
  @RequiredPermissions('elections:manage')
  async assign(@Body() body: { classId: string; studentId: string; electionId?: string; termEndsAt?: string }) {
    return this.service.assignCR(
      body.classId,
      body.studentId,
      body.electionId,
      body.termEndsAt ? new Date(body.termEndsAt) : undefined,
    );
  }

  @Get('active/:classId')
  async getActive(@Param('classId') classId: string) {
    return this.service.getActiveCR(classId);
  }

  @Get('history/:classId')
  async getHistory(@Param('classId') classId: string) {
    return this.service.getHistory(classId);
  }

  @Post('revoke-expired')
  @RequiredPermissions('elections:manage')
  async revokeExpired() {
    return this.service.revokeExpiredCRs();
  }
}
