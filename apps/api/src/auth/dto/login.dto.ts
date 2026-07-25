import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../common/validation/decorators/trim.decorator';
import { ToLowerCase } from '../../common/validation/decorators/to-lowercase.decorator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @ToLowerCase()
  @Trim()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
