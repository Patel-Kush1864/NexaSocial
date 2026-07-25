import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('mail.host') || process.env.MAIL_HOST,
          port:
            configService.get<number>('mail.port') ||
            parseInt(process.env.MAIL_PORT || '587', 10),
          auth: {
            user:
              configService.get<string>('mail.user') || process.env.MAIL_USER,
            pass:
              configService.get<string>('mail.password') ||
              process.env.MAIL_PASSWORD,
          },
        },
        defaults: {
          from: `"NexaSocial" <${
            configService.get<string>('mail.from') ||
            process.env.MAIL_FROM ||
            'noreply@nexasocial.com'
          }>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
