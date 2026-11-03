import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ElectionsService } from './elections.service';
import { ElectionsController } from './elections.controller';
import { CRElection, CRElectionSchema } from './schemas/cr-election.schema';
import { CRCandidate, CRCandidateSchema } from './schemas/cr-candidate.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CRElection.name, schema: CRElectionSchema },
      { name: CRCandidate.name, schema: CRCandidateSchema },
    ]),
    UsersModule,
  ],
  providers: [ElectionsService],
  controllers: [ElectionsController],
  exports: [ElectionsService],
})
export class ElectionsModule {}
