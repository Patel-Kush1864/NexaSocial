import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => getTypeOrmConfig(),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule { }
