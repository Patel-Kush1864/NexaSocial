import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { Trim } from '../../common/validation/decorators/trim.decorator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'First name must contain only letters' })
  @Trim()
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Last name must contain only letters' })
  @Trim()
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be a valid E.164 phone number (10-15 digits)',
  })
  @Trim()
  phoneNumber?: string;
}
