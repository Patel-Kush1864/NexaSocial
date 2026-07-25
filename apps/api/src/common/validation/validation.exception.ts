import { BadRequestException } from '@nestjs/common';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ValidationException extends BadRequestException {
  constructor(public readonly errors: ValidationErrorDetail[]) {
    super({
      message: 'Validation failed',
      errors,
    });
  }
}
