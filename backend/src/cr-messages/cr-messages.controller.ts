import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CrMessagesService } from './cr-messages.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('cr-messages')
@UseGuards(JwtAuthGuard)
export class CrMessagesController {
  constructor(private service: CrMessagesService) {}

  @Get()
  async list(@CurrentUser('sub') userId: string) {
    return this.service.listForUser(userId);
  }

  @Get('thread')
  async thread(
    @Query('studentId') studentId: string,
    @CurrentUser('sub') crId: string,
  ) {
    return this.service.threadWithStudent(crId, studentId);
  }

  @Post()
  async send(
    @Body() body: { content: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.sendAsStudent(userId, body?.content);
  }

  @Post('reply/:studentId')
  async reply(
    @Param('studentId') studentId: string,
    @Body() body: { content: string },
    @CurrentUser('sub') crId: string,
  ) {
    return this.service.replyAsCr(crId, studentId, body?.content);
  }
}
