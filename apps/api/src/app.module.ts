import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerMiddleware } from './logger/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { GoogleModule } from './auth/google/google.module';
import { UsersModule } from './users/users.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { WorkspaceMembersModule } from './workspace-members/workspace-members.module';
import { SocialModule } from './social/social.module';
import { LiveStreamsModule } from './livestreams/livestreams.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    LoggerModule,
    EventEmitterModule.forRoot(),
    AuthModule,
    GoogleModule,
    UsersModule,
    SubscriptionsModule,
    WorkspacesModule,
    WorkspaceMembersModule,
    SocialModule,
    LiveStreamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
