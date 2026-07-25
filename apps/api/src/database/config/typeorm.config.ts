import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const getTypeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'nexasocial',
  timezone: 'Z', // UTC Timezone
  charset: 'utf8mb4',
  extra: {
    connectionLimit: 10,
    charset: 'utf8mb4_unicode_ci',
  },
  synchronize: false,
  logging: process.env.APP_ENV === 'development',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  subscribers: [__dirname + '/../subscribers/*{.ts,.js}'],
  namingStrategy: new SnakeNamingStrategy(),
});
