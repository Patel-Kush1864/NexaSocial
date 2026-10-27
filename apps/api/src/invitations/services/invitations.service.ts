import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation, InvitationStatus } from '../entities/invitation.entity';
import {
  CreateInvitationDto,
  AcceptInvitationDto,
  RejectInvitationDto,
} from '../dto/invitations.dto';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import {
  WorkspaceMember,
  WorkspaceRole,
} from '../../workspace-members/entities/workspace-member.entity';
import { UsersRepository } from '../../users/repositories/users.repository';
import { MailService } from '../../mail/mail.service';
import { UsageLimitService } from '../../subscriptions/services/usage-limit.service';
import { ActivityLog } from '../../users/entities/activity-log.entity';
import { LoggerServiceWrapper } from '../../logger/logger.service';
import * as crypto from 'crypto';

import { WORKSPACE_ROLE_PERMISSIONS } from '../../workspaces/constants/workspace-permissions.constants';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly usersRepository: UsersRepository,
    private readonly mailService: MailService,
    private readonly usageLimitService: UsageLimitService,
    private readonly loggerService: LoggerServiceWrapper,
  ) { }

  async invite(
    workspaceId: string,
    invitedById: string,
    dto: CreateInvitationDto,
  ): Promise<Invitation> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // 0. Validate inviter permissions and role
    const inviterMember = await this.memberRepository.findOne({
      where: { workspaceId, userId: invitedById },
    });
    const inviterUser = await this.usersRepository.findById(invitedById);
    const isSuperAdmin = inviterUser?.role?.name === 'SUPER_ADMIN';

    if (
      !isSuperAdmin &&
      (!inviterMember ||
        ![WorkspaceRole.OWNER, WorkspaceRole.MANAGER].includes(
          inviterMember.role,
        ))
    ) {
      throw new ForbiddenException(
        'Only authorized workspace administrators can manage team members.',
      );
    }

    // Validate assigned role
    const allowedRolesToAssign = [
      WorkspaceRole.MANAGER,
      WorkspaceRole.CREATOR,
      WorkspaceRole.VIEWER,
    ];

    if (!allowedRolesToAssign.includes(dto.role as WorkspaceRole)) {
      throw new ForbiddenException(
        'You cannot assign this role. Please select a role you are authorized to assign.',
      );
    }

    // A MANAGER cannot invite another MANAGER or OWNER
    if (inviterMember && inviterMember.role === WorkspaceRole.MANAGER) {
      if (
        dto.role === WorkspaceRole.MANAGER ||
        (dto.role as string) === 'OWNER'
      ) {
        throw new ForbiddenException(
          'You cannot assign this role. Please select a role you are authorized to assign.',
        );
      }
    }

    // 1. Check workspace owner's member limit
    const allowed = await this.usageLimitService.canAddMember(
      workspace.ownerId,
    );
    if (!allowed) {
      throw new BadRequestException(
        'Your workspace has reached the limit for this feature. Please contact the workspace owner to manage the plan.',
      );
    }

    // 2. Check if user already exists and is a member
    const targetUser = await this.usersRepository.findByEmail(dto.email);
    if (targetUser) {
      const existingMember = await this.memberRepository.findOne({
        where: { workspaceId, userId: targetUser.id },
      });
      if (existingMember) {
        throw new BadRequestException(
          'User is already a member of this workspace',
        );
      }
    }

    // 3. Check for active pending invitation
    const pendingInvite = await this.invitationRepository.findOne({
      where: {
        workspaceId,
        email: dto.email,
        status: InvitationStatus.PENDING,
      },
    });
    if (pendingInvite) {
      throw new BadRequestException(
        'An invitation is already pending for this email address',
      );
    }

    // 4. Generate token and create record
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days

    const invitation = this.invitationRepository.create({
      workspaceId,
      email: dto.email,
      role: dto.role,
      token,
      status: InvitationStatus.PENDING,
      expiresAt,
      invitedById,
    });
    await this.invitationRepository.save(invitation);

    // 5. Send Invite Email
    let inviterName = 'A team administrator';
    const inviter = await this.usersRepository.findById(invitedById);
    if (inviter) {
      inviterName =
        `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() ||
        inviter.email;
    }

    await this.mailService.sendWorkspaceInvitation({
      email: dto.email,
      inviterName,
      workspaceName: workspace.name,
      role: dto.role,
      token,
      invitationId: invitation.id,
    });

    this.loggerService.log(
      `User ${dto.email} invited to Workspace ${workspaceId} by User ${invitedById}`,
      'InvitationsService',
      'security',
    );

    // Log Activity
    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId: invitedById,
        action: 'MEMBER_INVITED',
        metadata: { workspaceId, inviteEmail: dto.email, role: dto.role },
      }),
    );

    return invitation;
  }

  async validateToken(token: string) {
    if (!token) {
      throw new BadRequestException('Invitation token is required');
    }

    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation token is invalid or expired');
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException(
        'This invitation has already been accepted. Please log in to access your workspace.',
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Invitation is no longer active (Status: ${invitation.status})`,
      );
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException(
        'This invitation has expired. Please ask the workspace owner to send a new invitation.',
      );
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: invitation.workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace no longer exists');
    }

    let inviterName = 'Team Administrator';
    if (invitation.invitedById) {
      const inviter = await this.usersRepository.findById(invitation.invitedById);
      if (inviter) {
        inviterName =
          `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() ||
          inviter.email;
      }
    }

    return {
      valid: true,
      email: invitation.email,
      role: invitation.role,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      inviterName,
      expiresAt: invitation.expiresAt,
      status: invitation.status,
    };
  }

  async accept(dto: AcceptInvitationDto, userId: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token: dto.token },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation token is invalid or expired');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        'Please use the email address to which this invitation was sent.',
      );
    }

    // Check if user is already an active member (idempotent handling)
    const existingMember = await this.memberRepository.findOne({
      where: { workspaceId: invitation.workspaceId, userId },
      withDeleted: true,
    });

    if (invitation.status === InvitationStatus.ACCEPTED) {
      if (existingMember) {
        const rolePermissions =
          WORKSPACE_ROLE_PERMISSIONS[existingMember.role] || [];
        return {
          success: true,
          workspaceId: invitation.workspaceId,
          role: existingMember.role,
          permissions: rolePermissions,
          alreadyMember: true,
        };
      }
      throw new BadRequestException(
        'This invitation has already been accepted. Please log in to access your workspace.',
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Invitation is no longer active (Status: ${invitation.status})`,
      );
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException(
        'This invitation has expired. Please ask the workspace owner to send a new invitation.',
      );
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: invitation.workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace no longer exists');
    }

    // If existing member record exists (e.g. soft-deleted or re-inviting)
    if (existingMember) {
      if (existingMember.deleted_at) {
        existingMember.deleted_at = undefined;
      }
      existingMember.role = invitation.role;
      existingMember.invitedBy = invitation.invitedById;
      await this.memberRepository.save(existingMember);

      invitation.status = InvitationStatus.ACCEPTED;
      await this.invitationRepository.save(invitation);

      const rolePermissions =
        WORKSPACE_ROLE_PERMISSIONS[existingMember.role] || [];
      return {
        success: true,
        workspaceId: invitation.workspaceId,
        role: existingMember.role,
        permissions: rolePermissions,
      };
    }

    // New membership: check member limits at time of accept
    const allowed = await this.usageLimitService.canAddMember(
      workspace.ownerId,
    );
    if (!allowed) {
      throw new BadRequestException(
        'Your workspace has reached the limit for this feature. Please contact the workspace owner to manage the plan.',
      );
    }

    const member = this.memberRepository.create({
      workspaceId: invitation.workspaceId,
      userId,
      role: invitation.role,
      invitedBy: invitation.invitedById,
    });
    await this.memberRepository.save(member);

    // Update invitation status
    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invitation);

    const rolePermissions = WORKSPACE_ROLE_PERMISSIONS[member.role] || [];

    this.loggerService.log(
      `User ${userId} accepted invitation (Token: ${dto.token}) and joined Workspace ${invitation.workspaceId}`,
      'InvitationsService',
      'security',
    );

    // Log Activity
    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'MEMBER_JOINED',
        metadata: {
          workspaceId: invitation.workspaceId,
          role: invitation.role,
          invitedBy: invitation.invitedById,
        },
      }),
    );

    // Notify inviter that invitation was accepted
    try {
      const inviter = await this.usersRepository.findById(invitation.invitedById);
      const acceptedUser = user;
      if (inviter?.email && acceptedUser) {
        const inviterName =
          `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() ||
          inviter.email;
        const acceptedUserName =
          `${acceptedUser.firstName || ''} ${acceptedUser.lastName || ''}`.trim() ||
          acceptedUser.email;
        await this.mailService.sendWorkspaceInvitationAccepted({
          inviterUserId: inviter.id,
          inviterName,
          inviterEmail: inviter.email,
          acceptedUserName,
          acceptedUserEmail: acceptedUser.email,
          workspaceName: workspace.name,
          role: invitation.role,
        });
      }
    } catch (e: any) {
      this.loggerService.warn(
        `Failed to send invitation accepted email: ${e.message}`,
        'InvitationsService',
      );
    }

    return {
      success: true,
      workspaceId: invitation.workspaceId,
      role: member.role,
    };
  }

  async reject(dto: RejectInvitationDto, userId: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token: dto.token },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation token is invalid or expired');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Invitation is no longer active (Status: ${invitation.status})`,
      );
    }

    const user = await this.usersRepository.findById(userId);
    if (!user || user.email !== invitation.email) {
      throw new ForbiddenException(
        'You cannot reject an invitation sent to another user',
      );
    }

    invitation.status = InvitationStatus.REJECTED;
    await this.invitationRepository.save(invitation);

    this.loggerService.log(
      `User ${userId} rejected invitation to Workspace ${invitation.workspaceId}`,
      'InvitationsService',
      'application',
    );

    return { success: true };
  }

  async getPendingInvitations(workspaceId: string): Promise<any[]> {
    const list = await this.invitationRepository.find({
      where: { workspaceId, status: InvitationStatus.PENDING },
      relations: ['invitedBy'],
      order: { created_at: 'DESC' },
    });
    return list.map((inv) => ({
      ...inv,
      invitedBy: inv.invitedBy
        ? {
            id: inv.invitedBy.id,
            firstName: inv.invitedBy.firstName,
            lastName: inv.invitedBy.lastName,
            email: inv.invitedBy.email,
            avatar: inv.invitedBy.avatar,
          }
        : null,
      createdAt: inv.created_at || (inv as any).createdAt,
      updatedAt: inv.updated_at || (inv as any).updatedAt,
      expiresAt: inv.expiresAt || (inv as any).expires_at,
    }));
  }

  async resendInvitation(
    workspaceId: string,
    invitationId: string,
    performerId: string,
  ): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({
      where: {
        id: invitationId,
        workspaceId,
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Pending invitation not found');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    invitation.token = token;
    invitation.expiresAt = expiresAt;

    await this.invitationRepository.save(invitation);

    const acceptLink = `http://localhost:3000/invitations/accept?token=${token}`;
    await this.mailService.sendMail({
      to: invitation.email,
      subject: `Invitation to join workspace "${workspace.name}" (Reminder)`,
      text: `You have been invited to join the workspace "${workspace.name}" as a ${invitation.role}.\n\nClick the link to accept:\n${acceptLink}`,
    });

    this.loggerService.log(
      `Invitation to ${invitation.email} resent for Workspace ${workspaceId} by User ${performerId}`,
      'InvitationsService',
    );

    return invitation;
  }

  async cancelInvitation(
    workspaceId: string,
    invitationId: string,
    performerId: string,
  ): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: {
        id: invitationId,
        workspaceId,
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Pending invitation not found');
    }

    await this.invitationRepository.remove(invitation);

    this.loggerService.log(
      `Invitation to ${invitation.email} cancelled for Workspace ${workspaceId} by User ${performerId}`,
      'InvitationsService',
    );
  }
}
