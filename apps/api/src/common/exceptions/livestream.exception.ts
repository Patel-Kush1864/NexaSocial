import { HttpException, HttpStatus } from '@nestjs/common';

export class LiveStreamException extends HttpException {
  constructor(message = 'Live stream error', status = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}
