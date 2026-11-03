import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VotingService } from './voting.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('voting')
@UseGuards(JwtAuthGuard)
export class VotingController {
  constructor(private service: VotingService) {}

  @Post('authorize')
  async authorize(
    @CurrentUser('sub') userId: string,
    @Body() body: { electionId: string },
  ) {
    return this.service.requestAuthorization(userId, body.electionId);
  }

  @Post('vote')
  async vote(
    @Body() body: { choice: 'support' | 'oppose' | 'abstain'; authorizationToken: string; candidateId?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.castVote(
      body.candidateId || '',
      body.choice,
      body.authorizationToken,
    );
  }

  @Get('results/:electionId')
  async results(@Query('electionId') electionId: string) {
    return this.service.getResults(electionId);
  }

  @Get('has-voted/:electionId')
  async hasVoted(
    @CurrentUser('sub') userId: string,
    @Query('electionId') electionId: string,
  ) {
    return { hasVoted: await this.service.hasVoted(userId, electionId) };
  }
}
