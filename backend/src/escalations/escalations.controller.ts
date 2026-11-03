import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EscalationsService } from './escalations.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('escalations')
@UseGuards(JwtAuthGuard)
export class EscalationsController {
  constructor(private service: EscalationsService) {}

  @Post()
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post(':id/respond')
  async respond(
    @Param('id') id: string,
    @Body() body: { response: string },
    @CurrentUser('sub') responderId: string,
  ) {
    return this.service.respond(id, body.response, responderId);
  }
}
