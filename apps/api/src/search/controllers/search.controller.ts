import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../admin/guards/admin.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';

@Controller('admin/search')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') q: string, @CurrentUser() user: CurrentUserType) {
    if (!q || q.length < 2) {
      return {
        query: q,
        results: {
          users: [],
          workspaces: [],
          liveStreams: [],
          socialAccounts: [],
          payments: [],
          settings: [],
        },
      };
    }

    return this.searchService.globalSearch(q, user);
  }
}
