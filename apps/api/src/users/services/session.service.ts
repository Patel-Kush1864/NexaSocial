import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../entities/user-session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
  ) {}

  async getSessions(userId: string, currentSessionId: string) {
    const sessions = await this.sessionRepository.find({
      where: { userId },
      order: { created_at: 'DESC' },
    });

    return sessions.map((s) => ({
      id: s.id,
      browser: s.browser || 'unknown',
      device: s.device || 'unknown',
      ip: s.ipAddress || 'unknown',
      loginTime: s.created_at,
      isCurrent: s.id === currentSessionId,
    }));
  }

  async logoutSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    await this.sessionRepository.delete({ id: sessionId });
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this.sessionRepository.delete({ userId });
  }
}
