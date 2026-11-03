import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResolutionsService } from './resolutions.service';
import { ResolutionsController } from './resolutions.controller';
import { Resolution, ResolutionSchema } from './schemas/resolution.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Resolution.name, schema: ResolutionSchema }]),
  ],
  providers: [ResolutionsService],
  controllers: [ResolutionsController],
  exports: [ResolutionsService],
})
export class ResolutionsModule {}
