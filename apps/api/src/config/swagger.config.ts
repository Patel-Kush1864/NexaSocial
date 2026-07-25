import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  title: 'NexaSocial API',
  description: 'The NexaSocial Backend REST API documentation',
  version: '1.0',
  authScheme: 'bearer',
}));
