import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VotingService } from './voting.service';
import { VotingController } from './voting.controller';
import { AnonymousBallot, AnonymousBallotSchema } from './schemas/anonymous-ballot.schema';
import { VotingAuthorization, VotingAuthorizationSchema } from './schemas/voting-authorization.schema';
import { ElectionsModule } from '../elections/elections.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnonymousBallot.name, schema: AnonymousBallotSchema },
      { name: VotingAuthorization.name, schema: VotingAuthorizationSchema },
    ]),
    ElectionsModule,
    UsersModule,
  ],
  providers: [VotingService],
  controllers: [VotingController],
  exports: [VotingService],
})
export class VotingModule {}
