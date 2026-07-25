import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async findAll(): Promise<Plan[]> {
    return this.planRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }
    return plan;
  }

  async findByName(name: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { name } });
    if (!plan) {
      throw new NotFoundException(`Plan with name "${name}" not found`);
    }
    return plan;
  }

  async create(dto: CreatePlanDto): Promise<Plan> {
    const plan = this.planRepository.create(dto);
    return this.planRepository.save(plan);
  }
}
