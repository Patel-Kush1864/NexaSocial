import { IsEmail, IsNotEmpty } from 'class-validator';
import { Trim } from '../../common/validation/decorators/trim.decorator';
import { ToLowerCase } from '../../common/validation/decorators/to-lowercase.decorator';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @ToLowerCase()
  @Trim()
  email: string;
}
