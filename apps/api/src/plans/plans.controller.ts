import { Controller, Get, Param } from '@nestjs/common';
import { PlansService } from './plans.service';
import { Plan } from './entities/plan.entity';
import { Public } from '../auth/decorators/public.decorator';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Public()
  @Get()
  async getPlans(): Promise<Plan[]> {
    return this.plansService.findAll();
  }

  @Public()
  @Get(':id')
  async getPlanDetails(@Param('id') id: string): Promise<Plan> {
    return this.plansService.findOne(id);
  }
}
