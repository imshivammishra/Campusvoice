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
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('proposals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProposalsController {
  constructor(private service: ProposalsService) {}

  @Post()
  async create(@Body() body: any, @CurrentUser('sub') userId: string) {
    return this.service.create(body, userId);
  }

  @Get()
  async findAll(@Query() query: any, @CurrentUser() viewer: any) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;
    if (query.mine === 'true' && Types.ObjectId.isValid(viewer?.sub)) {
      filter.createdBy = new Types.ObjectId(viewer.sub);
    }
    return this.service.findAll(
      filter,
      parseInt(query.page || '1', 10),
      parseInt(query.limit || '50', 10),
      { role: viewer?.role, id: viewer?.sub },
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() viewer: any,
  ): Promise<any> {
    return this.service.findById(id, { role: viewer?.role, id: viewer?.sub });
  }

  @Get('pid/:proposalId')
  async findByProposalId(@Param('proposalId') proposalId: string) {
    return this.service.findByProposalId(proposalId);
  }

  @Post(':id/vote')
  async vote(
    @Param('id') id: string,
    @Body() body: { choice: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.vote(id, userId, body.choice);
  }

  @Post(':id/start-voting')
  async startVoting(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.startVoting(id, userId);
  }

  @Post(':id/close-voting')
  async closeVoting(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.closeVoting(id, userId);
  }

  @Post(':id/forward')
  async forwardConcern(
    @Param('id') id: string,
    @Body() body: { note?: string; forwardTo?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.forward(id, userId, body?.note, body?.forwardTo);
  }

  @Post(':id/review')
  async review(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.review(id, userId, body?.note);
  }

  @Post(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @Body() body: { note: string; attachments?: string[] },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.resolve(id, userId, body?.note, body?.attachments || []);
  }

  @Post(':id/escalate')
  async escalateConcern(
    @Param('id') id: string,
    @Body() body: { note?: string; escalateTo?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.escalate(id, userId, body?.note, body?.escalateTo);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.reject(id, userId, body?.note);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.remove(id, userId);
  }

  @Patch(':id/publish')
  @RequiredPermissions('proposals:publish')
  async publish(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.publish(id, userId);
  }

  @Patch(':id/certify')
  @RequiredPermissions('proposals:publish')
  async certify(@Param('id') id: string) {
    return this.service.certify(id);
  }
}
