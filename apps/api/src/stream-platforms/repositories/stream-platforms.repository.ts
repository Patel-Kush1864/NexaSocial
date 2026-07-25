import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  StreamPlatform,
  StreamPlatformStatus,
} from '../entities/stream-platform.entity';

@Injectable()
export class StreamPlatformsRepository extends Repository<StreamPlatform> {
  constructor(private readonly dataSource: DataSource) {
    super(StreamPlatform, dataSource.createEntityManager());
  }

  async findByStreamId(streamId: string): Promise<StreamPlatform[]> {
    return this.find({
      where: { streamId },
      relations: { connectedAccount: true },
    });
  }

  async updateStatus(id: string, status: StreamPlatformStatus): Promise<void> {
    await this.update(id, { status });
  }
}
