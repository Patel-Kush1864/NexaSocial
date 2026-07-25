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
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : process.env.NODE_ENV === 'development'
            ? '.env.development'
            : '.env',
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
