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
import { ElectionsService } from './elections.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('elections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ElectionsController {
  constructor(private service: ElectionsService) {}

  @Post()
  @RequiredPermissions('elections:create')
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get()
  async findAll(@Query() query: any) {
    const filter: any = {};
    if (query.classId) filter.classId = query.classId;
    if (query.status) filter.status = query.status;
    return this.service.findAll(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('election/:electionId')
  async findByElectionId(@Param('electionId') electionId: string) {
    return this.service.findByElectionId(electionId);
  }

  @Post('nominate')
  @RequiredPermissions('elections:vote')
  async nominate(@Body() body: { electionId: string; studentId: string; manifesto?: string }) {
    return this.service.nominateCandidate(body.electionId, body.studentId, body.manifesto);
  }

  @Post('withdraw')
  @RequiredPermissions('elections:vote')
  async withdraw(@Body() body: { electionId: string; studentId: string }) {
    return this.service.withdrawCandidate(body.electionId, body.studentId);
  }

  @Get(':electionId/candidates')
  async getCandidates(@Param('electionId') electionId: string) {
    return this.service.getCandidates(electionId);
  }

  @Post(':electionId/open')
  @RequiredPermissions('elections:manage')
  async open(@Param('electionId') electionId: string) {
    return this.service.openVoting(electionId);
  }

  @Post(':electionId/vote')
  @RequiredPermissions('elections:vote')
  async vote(
    @Param('electionId') electionId: string,
    @Body() body: { candidateStudentId: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.voteForCandidate(electionId, userId, body.candidateStudentId);
  }

  @Post(':electionId/certify')
  @RequiredPermissions('elections:certify')
  async certify(@Param('electionId') electionId: string) {
    return this.service.certifyResults(electionId);
  }
}
