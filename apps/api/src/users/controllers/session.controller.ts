import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';

@Controller('users/sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  getSessions(@CurrentUser() user: CurrentUserType) {
    return this.sessionService.getSessions(user.id, user.sessionId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async logoutSession(
    @CurrentUser() user: CurrentUserType,
    @Param('id') sessionId: string,
  ): Promise<{ message: string }> {
    await this.sessionService.logoutSession(user.id, sessionId);
    return { message: 'Session successfully revoked' };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async logoutAllSessions(
    @CurrentUser() user: CurrentUserType,
  ): Promise<{ message: string }> {
    await this.sessionService.logoutAllSessions(user.id);
    return { message: 'All sessions successfully revoked' };
  }
}
