/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SystemSettingsService } from '../services/system-settings.service';
import { RoleEnum } from '../../auth/constants/roles.constants';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(private readonly settingsService: SystemSettingsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isMaintenance = await this.settingsService.isMaintenanceMode();
    if (!isMaintenance) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Allow ADMIN users even during maintenance mode
    if (user && user.role === RoleEnum.ADMIN) {
      return true;
    }

    throw new ServiceUnavailableException(
      'System is currently undergoing scheduled maintenance. Please try again later.',
    );
  }
}
