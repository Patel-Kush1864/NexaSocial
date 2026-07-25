import { DataSource } from 'typeorm';
import { Plan, PlanFeatures } from '../../plans/entities/plan.entity';

export async function seedPlans(dataSource: DataSource): Promise<Plan[]> {
  const planRepository = dataSource.getRepository(Plan);

  const plansToSeed = [
    {
      name: 'Free',
      description: 'Free plan with essential features for personal use',
      price: 0.0,
      interval: 'month',
      features: {
        workspaces: 1,
        socialAccounts: 2,
        teamMembers: 1,
        liveStreaming: false,
        analytics: false,
        aiFeatures: false,
        prioritySupport: false,
        storageGb: 1,
        apiAccess: false,
        customBranding: false,
        streamScheduling: false,
        multiPlatformStreaming: false,
      } as PlanFeatures,
      isActive: true,
    },
    {
      name: 'Starter',
      description: 'Starter plan for small teams and content creators',
      price: 499.0,
      interval: 'month',
      features: {
        workspaces: 2,
        socialAccounts: 5,
        teamMembers: 3,
        liveStreaming: true,
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
      name: 'Professional',
      description: 'Professional plan for growing businesses and power users',
      price: 999.0,
      interval: 'month',
      features: {
        workspaces: 10,
        socialAccounts: 20,
        teamMembers: 10,
        liveStreaming: true,
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
      name: 'Enterprise',
      description: 'Enterprise plan with unlimited limits and premium support',
      price: 0.0, // Managed via custom contracts, treated as Custom pricing
      interval: 'month',
      features: {
        workspaces: -1, // Unlimited
        socialAccounts: -1, // Unlimited
        teamMembers: -1, // Unlimited
        liveStreaming: true,
        analytics: true,
        aiFeatures: true,
        prioritySupport: true,
        storageGb: -1, // Unlimited
        apiAccess: true,
        customBranding: true,
        streamScheduling: true,
        multiPlatformStreaming: true,
      } as PlanFeatures,
      isActive: true,
    },
  ];

  const seededPlans: Plan[] = [];
  for (const planData of plansToSeed) {
    let plan = await planRepository.findOneBy({ name: planData.name });
    if (!plan) {
      plan = planRepository.create(planData);
      plan = await planRepository.save(plan);
    } else {
      // Update existing plans with new structure and features
      plan.description = planData.description;
      plan.price = planData.price;
      plan.interval = planData.interval;
      plan.features = planData.features;
      plan.isActive = planData.isActive;
      plan = await planRepository.save(plan);
    }
    seededPlans.push(plan);
  }
  return seededPlans;
}
