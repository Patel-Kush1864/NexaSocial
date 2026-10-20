/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MailService } from '../mail.service';
import { EmailLogQueryDto, TestEmailDto } from '../dto/email-query.dto';
import { AdminGuard } from '../../admin/guards/admin.guard';

@Controller('admin/email')
@UseGuards(AdminGuard)
export class AdminEmailController {
  constructor(private readonly mailService: MailService) { }

  @Get('status')
  async getStatus() {
    return this.mailService.verifyConnection();
  }

  @Post('test')
  async sendTestEmail(@Request() req: any, @Body() dto: TestEmailDto) {
    const adminEmail = dto.recipient || req.user?.email;
    return this.mailService.sendAdminTestEmail(adminEmail);
  }

  @Get('logs')
  async getLogs(@Query() query: EmailLogQueryDto) {
    return this.mailService.getLogs(query);
  }

  @Get('stats')
  async getStats() {
    return this.mailService.getStats();
  }

  @Post('retry/:id')
  async retryEmail(@Param('id') id: string) {
    const success = await this.mailService.retryFailedEmail(id);
    return { success, message: success ? 'Email redelivered' : 'Retry delivery failed' };
  }
}
