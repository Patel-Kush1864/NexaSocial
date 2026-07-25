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
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleEnum } from '../../auth/constants/roles.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import {
  UpdateUserStatusDto,
  UpdateWorkspaceStatusDto,
  CreatePlanDto,
  UpdatePlanDto,
  UpdateSocialPlatformConfigDto,
} from '../dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('dashboard')
  async getDashboardSummary() {
    return this.service.getDashboardSummary();
  }

  // --- USER MANAGEMENT ---
  @Get('users')
  async getUsers(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    return this.service.getUsers(limit, offset);
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.service.getUserById(id);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.service.updateUserStatus(id, dto.isActive, user.id);
  }

  @Delete('users/:id')
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
  async getWorkspaces(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    return this.service.getWorkspaces(limit, offset);
  }

  @Get('workspaces/:id')
  async getWorkspaceById(@Param('id') id: string) {
    return this.service.getWorkspaceById(id);
  }

  @Patch('workspaces/:id/status')
  async updateWorkspaceStatus(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceStatusDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.service.updateWorkspaceStatus(id, dto.isActive, user.id);
  }

  @Delete('workspaces/:id')
  async deleteWorkspace(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    await this.service.deleteWorkspace(id, user.id);
    return { success: true };
  }

  // --- PLAN MANAGEMENT ---
  @Get('plans')
  async getPlans() {
    return this.service.getPlans();
  }

  @Post('plans')
  async createPlan(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreatePlanDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.service.createPlan(dto, user.id);
  }

  @Put('plans/:id')
  async updatePlan(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.service.updatePlan(id, dto, user.id);
  }

  @Delete('plans/:id')
  async deletePlan(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    await this.service.deletePlan(id, user.id);
    return { success: true };
  }

  // --- PAYMENT & REFUND MONITORING ---
  @Get('payments')
  async getPayments(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    return this.service.getPayments(limit, offset);
  }

  @Get('payments/:id')
  async getPaymentById(@Param('id') id: string) {
    return this.service.getPaymentById(id);
  }

  @Get('refunds')
  async getRefunds(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    return this.service.getRefunds(limit, offset);
  }

  // --- SOCIAL PLATFORMS CONFIG ---
  @Get('social-platforms')
  async getSocialPlatforms() {
    return this.service.getSocialPlatforms();
  }

  @Put('social-platforms/:id')
  async updateSocialPlatformConfig(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateSocialPlatformConfigDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.service.updateSocialPlatformConfig(id, dto, user.id);
  }

  // --- SYSTEM HEALTH MONITORING ---
  @Get('system/health')
  async getSystemHealth() {
    return this.service.getSystemHealth();
  }
}
