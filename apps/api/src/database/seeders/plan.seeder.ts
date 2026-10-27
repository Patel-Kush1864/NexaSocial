import { DataSource } from 'typeorm';
import { Plan, PlanFeatures } from '../../plans/entities/plan.entity';

export async function seedPlans(dataSource: DataSource): Promise<Plan[]> {
  const planRepository = dataSource.getRepository(Plan);

  const plansToSeed = [
    {
      name: 'Starter Plan',
      code: 'starter',
      description: 'Starter plan for small teams, solo creators, and growing channels',
      price: 499.0,
      currency: 'INR',
      interval: 'month',
      billingType: 'recurring',
      isPopular: false,
      displayOrder: 1,
      features: {
        workspaces: 2,
        socialAccounts: 5,
        teamMembers: 3,
        liveStreaming: true,
        maxStreams: 20,
        analytics: true,
        aiFeatures: false,
        prioritySupport: false,
        storageGb: 5,
        apiAccess: false,
        customBranding: false,
        streamScheduling: true,
        multiPlatformStreaming: false,
      } as PlanFeatures,
      isActive: true,
    },
    {
      name: 'Pro Plan',
      code: 'pro',
      description: 'Pro plan for growing businesses, power users, and multi-platform creators',
      price: 999.0,
      currency: 'INR',
      interval: 'month',
      billingType: 'recurring',
      isPopular: true,
      displayOrder: 2,
      features: {
        workspaces: 10,
        socialAccounts: 20,
        teamMembers: 10,
        liveStreaming: true,
        maxStreams: 100,
        analytics: true,
        aiFeatures: true,
        prioritySupport: true,
        storageGb: 20,
        apiAccess: true,
        customBranding: true,
        streamScheduling: true,
        multiPlatformStreaming: true,
      } as PlanFeatures,
      isActive: true,
    },
    {
      name: 'Enterprise Plan',
      code: 'enterprise',
      description: 'Enterprise plan with unlimited limits, dedicated infrastructure, and premium SLA support',
      price: 2999.0,
      currency: 'INR',
      interval: 'month',
      billingType: 'recurring',
      isPopular: false,
      displayOrder: 3,
      features: {
        workspaces: -1,
        socialAccounts: -1,
        teamMembers: -1,
        liveStreaming: true,
        maxStreams: -1,
        analytics: true,
        aiFeatures: true,
        prioritySupport: true,
        storageGb: -1,
        apiAccess: true,
        customBranding: true,
        streamScheduling: true,
        multiPlatformStreaming: true,
      } as PlanFeatures,
      isActive: true,
    },
  ];

  // Deactivate any legacy plans (e.g. Free, Starter, Professional, Enterprise)
  await planRepository
    .createQueryBuilder()
    .update(Plan)
    .set({ isActive: false })
    .where('name NOT IN (:...names)', {
      names: plansToSeed.map((p) => p.name),
    })
    .execute();

  const seededPlans: Plan[] = [];
  for (const planData of plansToSeed) {
    let plan = await planRepository.findOne({
      where: [{ name: planData.name }, { code: planData.code }],
      withDeleted: true,
    });
    if (!plan) {
      plan = planRepository.create(planData);
      plan = await planRepository.save(plan);
    } else {
      plan.name = planData.name;
      plan.code = planData.code;
      plan.description = planData.description;
      plan.price = planData.price;
      plan.currency = planData.currency;
      plan.interval = planData.interval;
      plan.billingType = planData.billingType;
      plan.isPopular = planData.isPopular;
      plan.displayOrder = planData.displayOrder;
      plan.features = planData.features;
      plan.isActive = planData.isActive;
      plan.deleted_at = null as any;
      plan = await planRepository.save(plan);
    }
    seededPlans.push(plan);
  }
  return seededPlans;
}
