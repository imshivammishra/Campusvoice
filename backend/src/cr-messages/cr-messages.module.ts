import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CrMessagesService } from './cr-messages.service';
import { CrMessagesController } from './cr-messages.controller';
import { CrMessage, CrMessageSchema } from './schemas/cr-message.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CrMessage.name, schema: CrMessageSchema },
    ]),
    UsersModule,
  ],
  providers: [CrMessagesService],
  controllers: [CrMessagesController],
})
export class CrMessagesModule {}
