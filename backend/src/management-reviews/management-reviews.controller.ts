import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ManagementReviewsService } from './management-reviews.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('management-reviews')
@UseGuards(JwtAuthGuard)
export class ManagementReviewsController {
  constructor(private service: ManagementReviewsService) {}

  @Post()
  async create(@Body() body: any, @CurrentUser('sub') userId: string) {
    return this.service.create(body, userId);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('rid/:reviewId')
  async findByReviewId(@Param('reviewId') reviewId: string) {
    return this.service.findByReviewId(reviewId);
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
