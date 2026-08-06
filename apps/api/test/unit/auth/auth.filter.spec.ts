import { UnauthorizedException } from '@nestjs/common';
import { AuthFilter } from '../../../src/common/filters/auth.filter';

describe('AuthFilter', () => {
  let filter: AuthFilter;
  let mockLogger: any;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: any;

  beforeEach(() => {
    mockLogger = {
      warn: jest.fn(),
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockRequest = {
      method: 'POST',
      url: '/api/auth/login',
    };
    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };

    filter = new AuthFilter(mockLogger);
  });

  it('should preserve "Invalid email or password" error message', () => {
    const exception = new UnauthorizedException('Invalid email or password');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid email or password',
      }),
    );
  });

  it('should preserve "Invalid refresh token" error message', () => {
    const exception = new UnauthorizedException('Invalid refresh token');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid refresh token',
      }),
    );
  });

  it('should map generic malformed/jwt errors to "Invalid access token"', () => {
    const exception = new UnauthorizedException('jwt malformed');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid access token',
      }),
    );
  });

  it('should map generic expired error to "Access token has expired"', () => {
    const exception = new UnauthorizedException('jwt expired');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Access token has expired',
      }),
    );
  });
});
