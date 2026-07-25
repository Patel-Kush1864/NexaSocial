import { IsEmail, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { WorkspaceRole } from '../../workspace-members/entities/workspace-member.entity';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}

export class AcceptInvitationDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class RejectInvitationDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
