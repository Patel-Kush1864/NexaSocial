import { HttpException, HttpStatus } from '@nestjs/common';

export class SubscriptionException extends HttpException {
  constructor(
    message = 'Subscription error',
    status = HttpStatus.PAYMENT_REQUIRED,
  ) {
    super(message, status);
  }
}
