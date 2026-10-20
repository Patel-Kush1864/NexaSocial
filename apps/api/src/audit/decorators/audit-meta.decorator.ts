import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class AuditMeta {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export const GetAuditMeta = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuditMeta => {
    const request = ctx.switchToHttp().getRequest();

    // Extract IP (handling potential proxy headers if trust proxy is enabled)
    const ipAddress = request.ip || request.connection?.remoteAddress;

    // Extract User-Agent
    const userAgent = request.headers['user-agent'] || 'Unknown';

    // Extract Request ID (set by RequestIdMiddleware)
    const requestId = request['id'] || request.headers['x-request-id'];

    return {
      ipAddress:
        typeof ipAddress === 'string' ? ipAddress.substring(0, 45) : undefined,
      userAgent:
        typeof userAgent === 'string' ? userAgent.substring(0, 255) : undefined,
      requestId:
        typeof requestId === 'string' ? requestId.substring(0, 100) : undefined,
    };
  },
);
