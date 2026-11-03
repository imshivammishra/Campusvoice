import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { DepartmentsModule } from './departments/departments.module';
import { ClassesModule } from './classes/classes.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { ElectionsModule } from './elections/elections.module';
import { CrModule } from './cr/cr.module';
import { ProposalsModule } from './proposals/proposals.module';
import { VotingModule } from './voting/voting.module';
import { TeachersModule } from './teachers/teachers.module';
import { ManagementReviewsModule } from './management-reviews/management-reviews.module';
import { EscalationsModule } from './escalations/escalations.module';
import { ResolutionsModule } from './resolutions/resolutions.module';
import { SupportModule } from './support/support.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { CrMessagesModule } from './cr-messages/cr-messages.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
    }),
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DB_NAME || 'campusvoice',
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 50,
        minPoolSize: 10,
        retryWrites: true,
        w: 'majority',
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    InstitutionsModule,
    DepartmentsModule,
    ClassesModule,
    RegistrationsModule,
    ElectionsModule,
    CrModule,
    ProposalsModule,
    VotingModule,
    TeachersModule,
    ManagementReviewsModule,
    EscalationsModule,
    ResolutionsModule,
    SupportModule,
    NotificationsModule,
    AuditModule,
    AdminModule,
    UploadsModule,
    CrMessagesModule,
  ],
})
export class AppModule {}
