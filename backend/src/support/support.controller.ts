import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private service: SupportService) {}

  @Post()
  async createTicket(@Body() body: any, @CurrentUser('sub') userId: string) {
    return this.service.createTicket(body, userId);
  }

  @Get()
  async findAll() {
    return this.service.findTickets();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string) {
    return this.service.getMessages(id);
  }

  @Post(':id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body() body: { content: string; attachments?: string[] },
    @CurrentUser('sub') senderId: string,
  ) {
    return this.service.addMessage(id, senderId, body.content, body.attachments);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.markAsRead(id, userId);
  }
}
