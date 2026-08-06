import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleController } from './google.controller';
import { GoogleService } from './google.service';
import { GoogleStrategy } from './google.strategy';
import { GoogleAuthGuard } from './google.guard';
import { ConnectedAccount } from '../../social/entities/connected-account.entity';
import { OAuthToken } from '../../social/entities/oauth-token.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { User } from '../../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConnectedAccount, OAuthToken, Workspace, User]),
  ],
  controllers: [GoogleController],
  providers: [GoogleService, GoogleStrategy, GoogleAuthGuard],
  exports: [GoogleService],
})
export class GoogleModule {}
