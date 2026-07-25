import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../common/validation/decorators/trim.decorator';

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  @Trim()
  refreshToken: string;
}
