import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Trim } from '../../common/validation/decorators/trim.decorator';
import { ToLowerCase } from '../../common/validation/decorators/to-lowercase.decorator';
import { IsStrongPassword } from '../../common/validation/decorators/strong-password.decorator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'First name must contain only letters' })
  @Trim()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Last name must contain only letters' })
  @Trim()
  lastName: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @ToLowerCase()
  @Trim()
  email: string;

  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be a valid E.164 phone number (10-15 digits)',
  })
  @Trim()
  phoneNumber?: string;
}
