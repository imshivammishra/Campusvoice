import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CrService } from './cr.service';
import { CrController } from './cr.controller';
import { CRAssignment, CRAssignmentSchema } from './schemas/cr-assignment.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CRAssignment.name, schema: CRAssignmentSchema }]),
    UsersModule,
  ],
  providers: [CrService],
  controllers: [CrController],
  exports: [CrService],
})
export class CrModule {}
