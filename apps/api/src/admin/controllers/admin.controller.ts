import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import {
  UpdateUserStatusDto,
  UpdateWorkspaceStatusDto,
  UpdateSocialPlatformConfigDto,
  QueryWorkspacesDto,
} from '../dto/admin.dto';
import {
  GetAuditMeta,
  AuditMeta,
} from '../../audit/decorators/audit-meta.decorator';
import {
  QueryAdminUsersDto,
  QueryAdminPaymentsDto,
} from '../dto/admin-filters.dto';

import { AdminGuard } from '../guards/admin.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('dashboard')
  @RequirePermission('platform.dashboard.view')
  async getDashboardSummary() {
    return this.service.getDashboardSummary();
  }

  @Get('dashboard/kpis')
  @RequirePermission('platform.dashboard.view')
  async getDashboardKpis() {
    return this.service.getPlatformKpis();
  }

  // --- USER MANAGEMENT ---
  @Get('users')
  @RequirePermission('platform.users.view')
  async getUsers(@Query() query: QueryAdminUsersDto) {
    return this.service.getUsers(query);
  }

  @Get('users/:id')
  @RequirePermission('platform.users.view')
  async getUserById(@Param('id') id: string) {
    return this.service.getUserById(id);
  }

  @Patch('users/:id/status')
  @RequirePermission('platform.users.manage')
  async updateUserStatus(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.service.updateUserStatus(id, dto.isActive, user.id);
  }

  @Delete('users/:id')
  @RequirePermission('platform.users.manage')
  async deleteUser(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    await this.service.softDeleteUser(id, user.id);
    return { success: true };
  }

  // --- WORKSPACE MANAGEMENT ---
  @Get('workspaces')
  @RequirePermission('platform.workspaces.view')
  async getWorkspaces(@Query() query: QueryWorkspacesDto) {
    return this.service.getWorkspaces(query);
  }

  @Get('workspaces/:id')
  @RequirePermission('platform.workspaces.view')
  async getWorkspaceById(@Param('id') id: string) {
    return this.service.getWorkspaceById(id);
  }

  @Get('workspaces/:id/members')
  @RequirePermission('platform.workspaces.view')
  async getWorkspaceMembers(
    @Param('id') id: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    return this.service.getWorkspaceMembers(id, limit, offset);
  }

  @Get('workspaces/:id/subscription')
  @RequirePermission('platform.workspaces.view')
  async getWorkspaceSubscription(@Param('id') id: string) {
    return this.service.getWorkspaceSubscription(id);
  }

  @Get('workspaces/:id/usage')
  @RequirePermission('platform.workspaces.view')
  async getWorkspaceUsage(@Param('id') id: string) {
    return this.service.getWorkspaceUsage(id);
  }

  @Get('workspaces/:id/social-accounts')
  @RequirePermission('platform.workspaces.view')
  async getWorkspaceSocialAccounts(
    @Param('id') id: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    return this.service.getWorkspaceSocialAccounts(id, limit, offset);
  }

  @Get('workspaces/:id/streams')
  @RequirePermission('platform.workspaces.view')
  async getWorkspaceStreams(
    @Param('id') id: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    return this.service.getWorkspaceStreams(id, limit, offset);
  }

  @Get('workspaces/:id/activity')
  @RequirePermission('platform.workspaces.view')
  async getWorkspaceActivity(
    @Param('id') id: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    return this.service.getWorkspaceActivity(id, limit, offset);
  }

  @Patch('workspaces/:id/status')
  @RequirePermission('platform.workspaces.manage')
  async updateWorkspaceStatus(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceStatusDto,
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.service.updateWorkspaceStatus(
      id,
      dto.status,
      user.id,
      auditMeta,
    );
  }

  @Delete('workspaces/:id')
  @RequirePermission('platform.workspaces.manage')
  async deleteWorkspace(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');

    await this.service.deleteWorkspace(id, user.id);
    return { success: true };
  }

  // --- PAYMENT & REFUND MONITORING ---
  @Get('payments')
  @RequirePermission('platform.payments.view')
  async getPayments(@Query() query: QueryAdminPaymentsDto) {
    return this.service.getPayments(query);
  }

  @Get('payments/:id')
  @RequirePermission('platform.payments.view')
  async getPaymentById(@Param('id') id: string) {
    return this.service.getPaymentById(id);
  }

  @Get('refunds')
  @RequirePermission('platform.payments.view')
  async getRefunds(@Query() query: QueryAdminPaymentsDto) {
    return this.service.getRefunds(query);
  }

  // --- SYSTEM HEALTH MONITORING ---
  @Get('system/health')
  @RequirePermission('platform.system_health.view')
  async getSystemHealth() {
    return this.service.getSystemHealth();
  }
}
