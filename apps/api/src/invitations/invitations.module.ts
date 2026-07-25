import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';
import { InvitationsService } from './services/invitations.service';
import { InvitationsController } from './controllers/invitations.controller';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LoggerModule } from '../logger/logger.module';
import { ActivityLog } from '../users/entities/activity-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invitation,
      Workspace,
      WorkspaceMember,
      ActivityLog,
    ]),
    UsersModule,
    MailModule,
    SubscriptionsModule,
    LoggerModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService, TypeOrmModule],
})
export class InvitationsModule {}
