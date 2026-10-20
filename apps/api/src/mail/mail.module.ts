import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { MailService } from './mail.service';
import { EmailLog } from './entities/email-log.entity';
import { UserEmailPreference } from './entities/user-email-preference.entity';
import { User } from '../users/entities/user.entity';
import { EmailEventsListener } from './listeners/email-events.listener';
import { AdminEmailController } from './controllers/admin-email.controller';
import { EmailPreferencesController } from './controllers/email-preferences.controller';
import { EmailProcessor } from './processors/email.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailLog, UserEmailPreference, User]),
    BullModule.registerQueue({ name: 'email-jobs' }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host:
            configService.get<string>('mail.host') ||
            process.env.MAIL_HOST ||
            'smtp.gmail.com',
          port:
            configService.get<number>('mail.port') ||
            parseInt(process.env.MAIL_PORT || '587', 10),
          secure:
            configService.get<string>('mail.secure') === 'true' ||
            process.env.MAIL_SECURE === 'true' ||
            parseInt(process.env.MAIL_PORT || '587', 10) === 465,
          auth: {
            user:
              configService.get<string>('mail.user') || process.env.MAIL_USER,
            pass:
              configService.get<string>('mail.password') ||
              process.env.MAIL_PASSWORD,
          },
        },
        defaults: {
          from: `"${configService.get<string>('mail.fromName') || process.env.MAIL_FROM_NAME || 'NexaSocial'}" <${
            configService.get<string>('mail.from') ||
            process.env.MAIL_FROM_EMAIL ||
            process.env.MAIL_FROM ||
            'nexasocial101@gmail.com'
          }>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminEmailController, EmailPreferencesController],
  providers: [MailService, EmailEventsListener, EmailProcessor],
  exports: [MailService, TypeOrmModule],
})
export class MailModule { }
