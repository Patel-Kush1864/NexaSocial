import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StreamPlatform,
  StreamPlatformStatus,
} from '../entities/stream-platform.entity';
import {
  CreateStreamPlatformDto,
  UpdateStreamPlatformDto,
} from '../dto/stream-platform.dto';

@Injectable()
export class StreamPlatformsService {
  constructor(
    @InjectRepository(StreamPlatform)
    private readonly repository: Repository<StreamPlatform>,
  ) {}

  async create(dto: CreateStreamPlatformDto): Promise<StreamPlatform> {
    const entity = this.repository.create({
      ...dto,
      status: dto.status || StreamPlatformStatus.PENDING,
    });
    return this.repository.save(entity);
  }

  async findByStreamId(streamId: string): Promise<StreamPlatform[]> {
    return this.repository.find({
      where: { streamId },
      relations: { connectedAccount: true },
    });
  }

  async findOne(id: string): Promise<StreamPlatform> {
    const platform = await this.repository.findOne({
      where: { id },
      relations: { connectedAccount: true },
    });
    if (!platform) {
      throw new NotFoundException('Stream platform mapping not found');
    }
    return platform;
  }

  async update(
    id: string,
    dto: UpdateStreamPlatformDto,
  ): Promise<StreamPlatform> {
    const platform = await this.findOne(id);
    Object.assign(platform, dto);
    return this.repository.save(platform);
  }

  async updateStatus(
    id: string,
    status: StreamPlatformStatus,
  ): Promise<StreamPlatform> {
    const platform = await this.findOne(id);
    platform.status = status;
    return this.repository.save(platform);
  }
}
