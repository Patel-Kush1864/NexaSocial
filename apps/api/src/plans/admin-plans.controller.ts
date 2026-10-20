import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlansService } from './plans.service';
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

@Controller('admin/plans')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
export class AdminPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @RequirePermission('platform.plans.view')
  async getPlans(@Query() query: PlanListQueryDto) {
    return this.plansService.getAdminPlans(query);
  }

  @Get(':id')
  @RequirePermission('platform.plans.view')
  async getPlanDetails(@Param('id') id: string) {
    return this.plansService.getAdminPlanDetails(id);
  }

  @Post()
  @RequirePermission('platform.plans.manage')
  async createPlan(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreatePlanDto,
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    return this.plansService.createAdminPlan(dto, user.id, auditMeta);
  }

  @Patch(':id')
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
