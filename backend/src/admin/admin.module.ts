import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Institution,
  InstitutionSchema,
} from '../institutions/schemas/institution.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';
import { ClassEntity, ClassSchema } from '../classes/schemas/class.schema';
import {
  CRElection,
  CRElectionSchema,
} from '../elections/schemas/cr-election.schema';
import { Proposal, ProposalSchema } from '../proposals/schemas/proposal.schema';
import {
  RegistrationApproval,
  RegistrationApprovalSchema,
} from '../registrations/schemas/registration-approval.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Institution.name, schema: InstitutionSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: ClassEntity.name, schema: ClassSchema },
      { name: CRElection.name, schema: CRElectionSchema },
      { name: Proposal.name, schema: ProposalSchema },
      { name: RegistrationApproval.name, schema: RegistrationApprovalSchema },
    ]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
