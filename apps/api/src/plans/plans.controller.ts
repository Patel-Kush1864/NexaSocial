/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { Public } from '../auth/decorators/public.decorator';
import {
  GetAuditMeta,
  AuditMeta,
} from '../audit/decorators/audit-meta.decorator';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../auth/interfaces/current-user.interface';
import {
  CreatePlanDto,
  UpdatePlanDto,
  PlanListQueryDto,
  UpdatePlanStatusDto,
} from './dto/plan-management.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) { }

  // --- USER / PUBLIC API ---

  @Public()
  @Get()
  async getPlans(@Req() req: any, @Query() query: PlanListQueryDto) {
    // If request contains admin status query or page/limit and caller is an admin, provide admin view
    const user = req.user;
    if (
      user &&
      (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') &&
      (query.status || query.search || query.page || query.limit)
    ) {
      return this.plansService.getAdminPlans(query);
    }
    return this.plansService.findAll();
  }

  @Public()
  @Get('public')
  async getPublicPlans() {
    return this.plansService.findAll();
  }

  @Public()
  @Get('public/:id')
  async getPublicPlanDetails(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Public()
  @Get(':id')
  async getPlanById(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  // --- ADMIN COMPATIBILITY API ---

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
  @RequirePermission('platform.plans.manage')
  async createPlan(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreatePlanDto,
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    return this.plansService.createAdminPlan(dto, user.id, auditMeta);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
  @RequirePermission('platform.plans.manage')
  async updatePlan(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    return this.plansService.updateAdminPlan(id, dto, user.id, auditMeta);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
  @RequirePermission('platform.plans.manage')
  async updatePlanStatus(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdatePlanStatusDto,
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    return this.plansService.updateAdminPlanStatus(
      id,
      dto.status,
      user.id,
      auditMeta,
    );
  }
}
