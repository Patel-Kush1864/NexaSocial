import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const workspaceId =
      typeof req.query?.workspaceId === 'string'
        ? req.query.workspaceId
        : undefined;
    let state: string | undefined;

    if (workspaceId) {
      state = Buffer.from(JSON.stringify({ workspaceId })).toString('base64');
    }

    return {
      accessType: 'offline',
      prompt: 'consent',
      state,
    };
  }
}
