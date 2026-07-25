import { SetMetadata } from '@nestjs/common';
import { PlanFeatures } from '../../plans/entities/plan.entity';

export const REQUIRE_FEATURE_KEY = 'require_feature';

export const RequireFeature = (feature: keyof PlanFeatures) =>
  SetMetadata(REQUIRE_FEATURE_KEY, feature);
