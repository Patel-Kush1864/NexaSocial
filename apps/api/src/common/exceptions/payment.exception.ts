import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentException extends HttpException {
  constructor(
    message = 'Payment failed',
    status = HttpStatus.PAYMENT_REQUIRED,
  ) {
    super(message, status);
  }
}
