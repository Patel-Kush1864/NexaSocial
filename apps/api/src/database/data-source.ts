import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environmental variables based on current directory
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'nexasocial',
  timezone: 'Z',
  charset: 'utf8mb4',
  extra: {
    charset: 'utf8mb4_unicode_ci',
  },
  synchronize: false,
  logging: true,
  entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
  subscribers: [path.join(__dirname, '/subscribers/*{.ts,.js}')],
  namingStrategy: new SnakeNamingStrategy(),
};

console.log(
  `[DataSource Init]: Configured MySQL DataSource options for host: '${dataSourceOptions.host}', database: '${dataSourceOptions.database}'`,
);

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
