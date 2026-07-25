import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../../common/validation/decorators/strong-password.decorator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;
}
