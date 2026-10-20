import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../auth/constants/roles.constants';
import { User } from './entities/user.entity';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import {
  GetAuditMeta,
  AuditMeta,
} from '../audit/decorators/audit-meta.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../auth/interfaces/current-user.interface';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.users.view')
  async getDetails(@Param('id') id: string) {
    return this.usersService.getUserDetails(id);
  }

  @Get(':id/workspaces')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.users.view')
  async getWorkspaces(
    @Param('id') id: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    return this.usersService.getUserWorkspaces(
      id,
      parseInt(limitStr || '20'),
      parseInt(offsetStr || '0'),
    );
  }

  @Get(':id/subscriptions')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.users.view')
  async getSubscriptions(@Param('id') id: string) {
    return this.usersService.getUserSubscriptions(id);
  }

  @Get(':id/payments')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.users.view')
  async getPayments(
    @Param('id') id: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    return this.usersService.getUserPayments(
      id,
      parseInt(limitStr || '20'),
      parseInt(offsetStr || '0'),
    );
  }

  @Get(':id/social-accounts')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.users.view')
  async getSocialAccounts(@Param('id') id: string) {
    return this.usersService.getUserSocialAccounts(id);
  }

  @Get(':id/streams')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.users.view')
  async getStreams(
    @Param('id') id: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    return this.usersService.getUserStreams(
      id,
      parseInt(limitStr || '20'),
      parseInt(offsetStr || '0'),
    );
  }

  @Get(':id/activity')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.users.view')
  async getActivity(
    @Param('id') id: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    return this.usersService.getUserActivity(
      id,
      parseInt(limitStr || '20'),
      parseInt(offsetStr || '0'),
    );
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.users.view')
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.queryUsers(query);
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.users.manage')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: CurrentUserType,
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    return this.usersService.updateUserStatus(id, dto, user.id, auditMeta);
  }

  @Patch(':id/role')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.users.manage')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: CurrentUserType,
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    return this.usersService.updateUserRole(id, dto, user.id, auditMeta);
  }

  @Patch(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.WORKSPACE_OWNER)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }
}
