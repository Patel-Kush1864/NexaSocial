import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../common/validation/decorators/trim.decorator';

export class VerifyEmailDto {
  @IsNotEmpty()
  @IsString()
  @Trim()
  token: string;
}
