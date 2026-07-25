import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from '../../../src/subscriptions/subscriptions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  UserSubscription,
  SubscriptionStatus,
} from '../../../src/subscriptions/entities/user-subscription.entity';
import { ActivityLog } from '../../../src/users/entities/activity-log.entity';
import { PlansService } from '../../../src/plans/plans.service';
import { PaymentsService } from '../../../src/payments/payments.service';
import { LoggerServiceWrapper } from '../../../src/logger/logger.service';
import { MailService } from '../../../src/mail/mail.service';
import { createMockRepository } from '../../mocks/repository.mock';

describe('SubscriptionsService (Unit)', () => {
  let subscriptionsService: SubscriptionsService;
  let userSubRepo: any;
  let plansService: jest.Mocked<Partial<PlansService>>;
  let paymentsService: jest.Mocked<Partial<PaymentsService>>;

  beforeEach(async () => {
    userSubRepo = createMockRepository();

    plansService = {
      findByName: jest
        .fn()
        .mockResolvedValue({ id: 'free-plan', name: 'Free', price: 0 }),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 'pro-plan', name: 'Pro', price: 29 }),
    };

    paymentsService = {
      cancelSubscription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(UserSubscription),
          useValue: userSubRepo,
        },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: createMockRepository(),
        },
        { provide: PlansService, useValue: plansService },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: LoggerServiceWrapper, useValue: { log: jest.fn() } },
        {
          provide: MailService,
          useValue: { sendMail: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    subscriptionsService =
      module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('getCurrentSubscription', () => {
    it('should auto-assign Free plan if user has no subscription', async () => {
      userSubRepo.findOne.mockResolvedValue(null);
      const freeSub = {
        id: 'sub-1',
        userId: 'user-1',
        planId: 'free-plan',
        status: SubscriptionStatus.ACTIVE,
      };
      userSubRepo.create.mockReturnValue(freeSub);
      userSubRepo.save.mockResolvedValue(freeSub);

      const sub = await subscriptionsService.getCurrentSubscription('user-1');
      expect(sub).toBeDefined();
    });

    it('should return active subscription when found', async () => {
      const mockSub = {
        id: 'sub-1',
        userId: 'user-1',
        status: SubscriptionStatus.ACTIVE,
      };
      userSubRepo.findOne.mockResolvedValue(mockSub);
      const sub = await subscriptionsService.getCurrentSubscription('user-1');
      expect(sub).toEqual(mockSub);
    });
  });
});
