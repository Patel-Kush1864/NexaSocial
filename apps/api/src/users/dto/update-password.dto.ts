import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../../common/validation/decorators/strong-password.decorator';

export class UpdatePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;
}
