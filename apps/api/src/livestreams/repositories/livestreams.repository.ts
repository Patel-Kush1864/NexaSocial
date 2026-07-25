import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { LiveStream, StreamStatus } from '../entities/livestream.entity';

@Injectable()
export class LiveStreamsRepository extends Repository<LiveStream> {
  constructor(private readonly dataSource: DataSource) {
    super(LiveStream, dataSource.createEntityManager());
  }

  async findWorkspaceStreams(
    workspaceId: string,
    limit = 50,
    offset = 0,
  ): Promise<[LiveStream[], number]> {
    return this.findAndCount({
      where: { workspaceId },
      relations: { platforms: { connectedAccount: true } },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findHistory(workspaceId: string): Promise<LiveStream[]> {
    return this.find({
      where: {
        workspaceId,
        status: In([StreamStatus.ENDED, StreamStatus.CANCELLED]),
      },
      relations: { platforms: { connectedAccount: true } },
      order: { endedAt: 'DESC' },
    });
  }

  async getDashboardCounts(workspaceId: string): Promise<{
    scheduled: number;
    live: number;
    completed: number;
  }> {
    const scheduled = await this.count({
      where: { workspaceId, status: StreamStatus.SCHEDULED },
    });
    const live = await this.count({
      where: { workspaceId, status: StreamStatus.LIVE },
    });
    const completed = await this.count({
      where: { workspaceId, status: StreamStatus.ENDED },
    });

    return { scheduled, live, completed };
  }
}
