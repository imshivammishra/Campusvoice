import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import {
  RegistrationApproval,
  RegistrationApprovalSchema,
} from './schemas/registration-approval.schema';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RegistrationApproval.name, schema: RegistrationApprovalSchema },
    ]),
    UsersModule,
    AuditModule,
  ],
  providers: [RegistrationsService],
  controllers: [RegistrationsController],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
