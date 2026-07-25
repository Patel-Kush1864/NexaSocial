import { DATABASE_CONNECTION } from './database.constants';

export const databaseProviders = [
  {
    provide: DATABASE_CONNECTION,
    useValue: DATABASE_CONNECTION,
  },
];
