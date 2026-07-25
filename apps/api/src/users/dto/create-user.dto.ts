import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Trim } from '../../common/validation/decorators/trim.decorator';
import { ToLowerCase } from '../../common/validation/decorators/to-lowercase.decorator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @ToLowerCase()
  @Trim()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 100)
  password?: string;

  @IsOptional()
  @IsString()
  @Trim()
  firstName?: string;

  @IsOptional()
  @IsString()
  @Trim()
  lastName?: string;
}
