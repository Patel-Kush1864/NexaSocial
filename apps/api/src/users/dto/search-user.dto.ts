import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Trim } from '../../common/validation/decorators/trim.decorator';

export class SearchUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @Trim()
  q: string;
}
