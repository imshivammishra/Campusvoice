import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ManagementReviewsService } from './management-reviews.service';
import { ManagementReviewsController } from './management-reviews.controller';
import { ManagementReview, ManagementReviewSchema } from './schemas/management-review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ManagementReview.name, schema: ManagementReviewSchema }]),
  ],
  providers: [ManagementReviewsService],
  controllers: [ManagementReviewsController],
  exports: [ManagementReviewsService],
})
export class ManagementReviewsModule {}
