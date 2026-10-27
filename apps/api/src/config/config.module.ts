import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configLoads } from './index';
import { validationSchema } from './validation.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: configLoads,
      validationSchema,
      envFilePath: [
        '.env',
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.development',
      ],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
