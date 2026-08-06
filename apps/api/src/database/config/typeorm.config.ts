import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const getTypeOrmConfig = (): TypeOrmModuleOptions => {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const database = process.env.DB_DATABASE || 'nexasocial';
  const username = process.env.DB_USERNAME || 'root';

  // console.log(`[Database Connection Config]: Attempting connection to MySQL at ${host}:${port}, DB: '${database}', User: '${username}'`);

  return {
    type: 'mysql',
    host,
    port,
    username,
    password: process.env.DB_PASSWORD || '',
    database,
    timezone: 'Z', // UTC Timezone
    charset: 'utf8mb4',
    extra: {
      connectionLimit: 10,
      charset: 'utf8mb4_unicode_ci',
    },
    synchronize:
      process.env.APP_ENV === 'development' ||
      process.env.NODE_ENV !== 'production' ||
      process.env.TYPEORM_SYNCHRONIZE === 'true',
    logging: true,
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    subscribers: [__dirname + '/../subscribers/*{.ts,.js}'],
    namingStrategy: new SnakeNamingStrategy(),
  };
};
