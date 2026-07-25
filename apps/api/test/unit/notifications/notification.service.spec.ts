import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../../../src/notifications/services/notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../../../src/notifications/entities/notification.entity';
import { NotificationGateway } from '../../../src/notifications/websocket/notification.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createMockRepository } from '../../mocks/repository.mock';

describe('NotificationsService (Unit)', () => {
  let notificationsService: NotificationsService;
  let repo: any;
  let gateway: jest.Mocked<Partial<NotificationGateway>>;
  let eventEmitter: jest.Mocked<Partial<EventEmitter2>>;

  beforeEach(async () => {
    repo = createMockRepository();
    gateway = { emitNewNotification: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: repo },
        { provide: NotificationGateway, useValue: gateway },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    notificationsService =
      module.get<NotificationsService>(NotificationsService);
  });

  describe('create', () => {
    it('should create notification, emit websocket event and domain event', async () => {
      const dto = {
        userId: 'u-1',
        title: 'New Stream Scheduled',
        message: 'Your Youtube stream is set',
        type: 'SYSTEM',
      };

      const createdNotif = { id: 'n-1', ...dto, isRead: false };
      repo.create.mockReturnValue(createdNotif);
      repo.save.mockResolvedValue(createdNotif);

      const result = await notificationsService.create(dto as any);

      expect(repo.save).toHaveBeenCalled();
      expect(gateway.emitNewNotification).toHaveBeenCalledWith(
        'u-1',
        createdNotif,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'notification.created',
        createdNotif,
      );
      expect(result.id).toBe('n-1');
    });
  });
});
