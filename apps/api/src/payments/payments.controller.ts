import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  UseGuards,
  BadRequestException,
  Query,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentListQueryDto } from './dto/payment-list-query.dto';
import { PaymentStatisticsQueryDto } from './dto/payment-statistics-query.dto';
import { PaymentExportQueryDto } from './dto/payment-export-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../auth/interfaces/current-user.interface';
import { Public } from '../auth/decorators/public.decorator';
import { Request } from 'express';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-order')
  async createOrder(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.paymentsService.createOrder(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verifyPayment(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: VerifyPaymentDto,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.paymentsService.verifyPayment(user.id, dto);
  }

  @Public()
  @Post('webhook')
  async handleWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('stripe-signature') stripeSignature?: string,
    @Headers('x-razorpay-signature') razorpaySignature?: string,
  ) {
    // Resolve the raw body for signature verification.
    // If NestJS rawBody option is enabled, req.rawBody is a Buffer.
    // Otherwise, fall back to stringified req.body for test/dev payloads.
    let rawBody: Buffer | string = '';
    if (req.rawBody) {
      rawBody = req.rawBody;
    } else if (req.body) {
      rawBody =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    if (stripeSignature) {
      return this.paymentsService.handleWebhook(
        'STRIPE',
        rawBody,
        stripeSignature,
      );
    } else if (razorpaySignature) {
      return this.paymentsService.handleWebhook(
        'RAZORPAY',
        rawBody,
        razorpaySignature,
      );
    } else {
      throw new BadRequestException('Missing payment signature header');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getPaymentHistory(@CurrentUser() user: CurrentUserType) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.paymentsService.getHistory(user.id);
  }

  // --- ADMIN PLATFORM ROUTES ---

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('platform.payments.view')
  @Get()
  async findAll(@Query() query: PaymentListQueryDto) {
    return this.paymentsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('platform.payments.view')
  @Get('statistics')
  async getStatistics(@Query() query: PaymentStatisticsQueryDto) {
    return this.paymentsService.getStatistics(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('platform.payments.view')
  @Get('export')
  async exportPayments(
    @Query() query: PaymentExportQueryDto,
    @Res() res: Response,
  ) {
    const data = await this.paymentsService.exportPayments(query);

    if (!data.length) {
      return res.status(200).send('No payments found matching criteria.');
    }

    const header = Object.keys(data[0]).join(',');
    const rows = data.map((row) =>
      Object.values(row)
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="payments-export.csv"',
    );
    return res.status(200).send(csv);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('platform.payments.view')
  @Get(':id')
  async findOneById(@Param('id') id: string) {
    return this.paymentsService.findOneById(id);
  }
}
