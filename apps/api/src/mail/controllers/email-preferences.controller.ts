/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MailService } from '../mail.service';
import { UpdateEmailPreferencesDto } from '../dto/email-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('email')
export class EmailPreferencesController {
  constructor(private readonly mailService: MailService) { }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@Request() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.mailService.getPreferences(userId);
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(
    @Request() req: any,
    @Body() dto: UpdateEmailPreferencesDto,
  ) {
    const userId = req.user.id || req.user.userId;
    return this.mailService.updatePreferences(userId, dto);
  }

  @Get('unsubscribe')
  async unsubscribe(
    @Query('category') category: string,
    @Query('userId') userId?: string,
  ) {
    if (userId) {
      const updateDto: UpdateEmailPreferencesDto = {};
      if (category === 'STREAMING') updateDto.streamingEmails = false;
      if (category === 'SOCIAL') updateDto.socialEmails = false;
      if (category === 'WORKSPACE') updateDto.workspaceEmails = false;
      if (category === 'MARKETING') updateDto.marketingEmails = false;
      await this.mailService.updatePreferences(userId, updateDto);
    }

    return {
      success: true,
      message: `You have successfully unsubscribed from ${category || 'optional'} notifications. Essential security and billing notifications will still be delivered.`,
    };
  }
}
