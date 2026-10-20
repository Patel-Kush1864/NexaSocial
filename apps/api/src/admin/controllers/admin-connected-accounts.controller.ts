import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminConnectedAccountsService } from '../services/admin-connected-accounts.service';
import { AdminGetConnectedAccountsDto } from '../dto/connected-accounts.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';

@Controller('admin/connected-accounts')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
export class AdminConnectedAccountsController {
  constructor(
    private readonly connectedAccountsService: AdminConnectedAccountsService,
  ) {}

  @Get()
  @RequirePermission('platform.connected_accounts.view')
  async getConnectedAccounts(@Query() query: AdminGetConnectedAccountsDto) {
    return this.connectedAccountsService.getConnectedAccounts(query);
  }

  @Get('statistics')
  @RequirePermission('platform.connected_accounts.view')
  async getStatistics() {
    return this.connectedAccountsService.getStatistics();
  }

  @Get(':id/errors')
  @RequirePermission('platform.connected_accounts.view')
  async getAccountErrors(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.connectedAccountsService.getAccountErrors(id, page, limit);
  }
}
