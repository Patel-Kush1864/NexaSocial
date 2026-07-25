import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import mailConfig from './mail.config';
import oauthConfig from './oauth.config';
import redisConfig from './redis.config';
import storageConfig from './storage.config';
import swaggerConfig from './swagger.config';
import throttleConfig from './throttle.config';

export const configLoads = [
  appConfig,
  databaseConfig,
  jwtConfig,
  mailConfig,
  oauthConfig,
  redisConfig,
  storageConfig,
  swaggerConfig,
  throttleConfig,
];

export {
  appConfig,
  databaseConfig,
  jwtConfig,
  mailConfig,
  oauthConfig,
  redisConfig,
  storageConfig,
  swaggerConfig,
  throttleConfig,
};
