import { HttpException, HttpStatus } from '@nestjs/common';

export class WorkspaceException extends HttpException {
  constructor(message = 'Workspace error', status = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}
