process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-12345';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

jest.setTimeout(30000);

beforeEach(() => {
  jest.clearAllMocks();
});
