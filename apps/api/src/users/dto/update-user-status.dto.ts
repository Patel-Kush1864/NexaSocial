import { IsEnum, IsNotEmpty } from 'class-validator';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsEnum(UserStatus)
  status: UserStatus;
}
