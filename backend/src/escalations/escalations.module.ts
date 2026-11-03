import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EscalationsService } from './escalations.service';
import { EscalationsController } from './escalations.controller';
import { Escalation, EscalationSchema } from './schemas/escalation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Escalation.name, schema: EscalationSchema }]),
  ],
  providers: [EscalationsService],
  controllers: [EscalationsController],
  exports: [EscalationsService],
})
export class EscalationsModule {}
