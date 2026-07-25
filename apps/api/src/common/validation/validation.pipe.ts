import {
  Injectable,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { validationPipeOptions } from './validation.options';
import {
  ValidationException,
  ValidationErrorDetail,
} from './validation.exception';

@Injectable()
export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      ...validationPipeOptions,
      exceptionFactory: (validationErrors: ValidationError[]) => {
        const errors = this.formatErrors(validationErrors);
        return new ValidationException(errors);
      },
    });
  }

  private formatErrors(
    errors: ValidationError[],
    parentProperty = '',
  ): ValidationErrorDetail[] {
    const formattedErrors: ValidationErrorDetail[] = [];

    for (const error of errors) {
      const propertyPath = parentProperty
        ? `${parentProperty}.${error.property}`
        : error.property;

      if (error.constraints) {
        const constraints = Object.values(error.constraints);
        for (const constraint of constraints) {
          formattedErrors.push({
            field: propertyPath,
            message: constraint.charAt(0).toUpperCase() + constraint.slice(1),
          });
        }
      }

      if (error.children && error.children.length > 0) {
        formattedErrors.push(
          ...this.formatErrors(error.children, propertyPath),
        );
      }
    }

    return formattedErrors;
  }
}
