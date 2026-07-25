import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsThumbnailFormat(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isThumbnailFormat',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value || typeof value !== 'string') return true; // Optional values allowed if handled by @IsOptional

          // Allow data URLs for base64 images (e.g. data:image/png;base64,...)
          if (value.startsWith('data:image/')) {
            return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value);
          }

          // Check standard URL or file extension
          const lower = value.toLowerCase();
          return (
            lower.endsWith('.jpg') ||
            lower.endsWith('.jpeg') ||
            lower.endsWith('.png') ||
            lower.endsWith('.webp') ||
            /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(lower)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid JPG, JPEG, PNG, or WEBP image format.`;
        },
      },
    });
  };
}
