import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class UserDetailsResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  phoneNumber: string;

  @Expose()
  avatar: string;

  @Expose()
  status: string;

  @Expose()
  isActive: boolean;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  @Type(() => Date)
  created_at: Date;

  @Expose()
  @Type(() => Date)
  updated_at: Date;

  @Expose()
  @Type(() => Date)
  lastLoginAt: Date;

  @Expose()
  role: any;

  @Expose()
  workspaceCount: number;
}
