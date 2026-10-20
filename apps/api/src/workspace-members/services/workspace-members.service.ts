import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkspaceMember,
  WorkspaceRole,
} from '../entities/workspace-member.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { ActivityLog } from '../../users/entities/activity-log.entity';
import { LoggerServiceWrapper } from '../../logger/logger.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly loggerService: LoggerServiceWrapper,
    private readonly mailService: MailService,
  ) {}

  async addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    invitedBy?: string,
  ): Promise<WorkspaceMember> {
    // Check if membership already exists
    const existing = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });
    if (existing) {
      throw new BadRequestException(
        'User is already a member of this workspace',
      );
    }

    const member = this.memberRepository.create({
      workspaceId,
      userId,
      role,
      invitedBy,
    });
    await this.memberRepository.save(member);

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'MEMBER_JOINED',
        metadata: { workspaceId, role },
      }),
    );

    return member;
  }

  async removeMember(
    workspaceId: string,
    memberId: string,
    performerId: string,
  ): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId, workspaceId },
      relations: { user: true },
    });
    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    if (member.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Cannot remove the workspace owner');
    }

    await this.memberRepository.remove(member);

    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    if (member.user?.email) {
      const userName = `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || member.user.email;
      await this.mailService.sendMail({
        to: member.user.email,
        userId: member.userId,
        eventType: 'workspace.member_removed',
        subject: `Workspace Update: Removed from "${workspace?.name || 'Workspace'}"`,
        text: `Hi ${userName},\n\nYou have been removed from the workspace "${workspace?.name || 'Workspace'}".`,
        category: 'WORKSPACE',
      });
    }

    this.loggerService.log(
      `Member ${member.userId} removed from Workspace ${workspaceId} by User ${performerId}`,
      'WorkspaceMembersService',
      'security',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId: performerId,
        action: 'MEMBER_REMOVED',
        metadata: { workspaceId, removedUserId: member.userId },
      }),
    );
  }

  async updateRole(
    workspaceId: string,
    memberId: string,
    role: WorkspaceRole,
    performerId: string,
  ): Promise<WorkspaceMember> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId, workspaceId },
    });
    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    if (member.role === WorkspaceRole.OWNER || role === WorkspaceRole.OWNER) {
      throw new BadRequestException(
        'Cannot assign or modify OWNER role via member update. Please use ownership transfer.',
      );
    }

    const oldRole = member.role;
    member.role = role;
    await this.memberRepository.save(member);

    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    const memberWithUser = await this.memberRepository.findOne({
      where: { id: member.id },
      relations: { user: true },
    });

    if (memberWithUser?.user?.email) {
      const userName = `${memberWithUser.user.firstName || ''} ${memberWithUser.user.lastName || ''}`.trim() || memberWithUser.user.email;
      await this.mailService.sendMail({
        to: memberWithUser.user.email,
        userId: memberWithUser.userId,
        eventType: 'workspace.member_role_changed',
        subject: `Role Updated in "${workspace?.name || 'Workspace'}": ${role}`,
        text: `Hi ${userName},\n\nYour role in workspace "${workspace?.name || 'Workspace'}" has been updated from ${oldRole} to ${role}.`,
        category: 'WORKSPACE',
      });
    }

    this.loggerService.log(
      `Member role of ${member.userId} updated from ${oldRole} to ${role} in Workspace ${workspaceId} by User ${performerId}`,
      'WorkspaceMembersService',
      'security',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId: performerId,
        action: 'ROLE_CHANGED',
        metadata: {
          workspaceId,
          targetUserId: member.userId,
          oldRole,
          newRole: role,
        },
      }),
    );

    return member;
  }

  async leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });
    if (!member) {
      throw new NotFoundException(
        'Your membership was not found in this workspace',
      );
    }

    if (member.role === WorkspaceRole.OWNER) {
      throw new BadRequestException(
        'Workspace owner cannot leave the workspace. You must transfer ownership first.',
      );
    }

    await this.memberRepository.remove(member);

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'MEMBER_LEFT',
        metadata: { workspaceId },
      }),
    );
  }

  async findMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.memberRepository.find({
      where: { workspaceId },
      relations: { user: true },
    });
  }

  async findMemberByUser(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
    return this.memberRepository.findOne({ where: { workspaceId, userId } });
  }
}
