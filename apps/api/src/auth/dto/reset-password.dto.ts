import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../common/validation/decorators/trim.decorator';
import { IsStrongPassword } from '../../common/validation/decorators/strong-password.decorator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @Trim()
  token: string;

  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}
