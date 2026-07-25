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
import { WorkspaceMember } from '../../workspace-members/entities/workspace-member.entity';
import { UsersRepository } from '../../users/repositories/users.repository';
import { MailService } from '../../mail/mail.service';
import { UsageLimitService } from '../../subscriptions/services/usage-limit.service';
import { ActivityLog } from '../../users/entities/activity-log.entity';
import { LoggerServiceWrapper } from '../../logger/logger.service';
import * as crypto from 'crypto';

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
  ) {}

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

    // 1. Check workspace owner's member limit
    const allowed = await this.usageLimitService.canAddMember(
      workspace.ownerId,
    );
    if (!allowed) {
      throw new BadRequestException(
        'Workspace member limit reached. Please upgrade your subscription plan.',
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
    const acceptLink = `http://localhost:3000/invitations/accept?token=${token}`;
    await this.mailService.sendMail({
      to: dto.email,
      subject: `Invitation to join workspace "${workspace.name}"`,
      text: `You have been invited to join the workspace "${workspace.name}" as a ${dto.role}.\n\nClick the link to accept:\n${acceptLink}`,
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

  async accept(dto: AcceptInvitationDto, userId: string) {
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

    if (invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('Invitation token has expired');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: invitation.workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace no longer exists');
    }

    // Double check member limits at time of accept
    const allowed = await this.usageLimitService.canAddMember(
      workspace.ownerId,
    );
    if (!allowed) {
      throw new BadRequestException(
        'Workspace member limit has been reached. Owner must upgrade subscription plan.',
      );
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (user.email !== invitation.email) {
      throw new ForbiddenException(
        'This invitation was sent to a different email address',
      );
    }

    // Add to Workspace Members
    const existingMember = await this.memberRepository.findOne({
      where: { workspaceId: invitation.workspaceId, userId },
    });
    if (existingMember) {
      invitation.status = InvitationStatus.ACCEPTED;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException(
        'You are already a member of this workspace',
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

    return { success: true, workspaceId: invitation.workspaceId };
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
}
