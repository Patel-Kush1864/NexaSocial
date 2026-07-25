import { Global, Module } from '@nestjs/common';
import { LoggerServiceWrapper } from './logger.service';

@Global()
@Module({
  providers: [LoggerServiceWrapper],
  exports: [LoggerServiceWrapper],
})
export class LoggerModule {}
