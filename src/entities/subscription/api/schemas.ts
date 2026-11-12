import { z } from 'zod/mini';
import { PLAN_IDS, type SubscriptionData } from '../model/plans';

// 서버와 함께 쓰는 타입은 model/plans.ts에 두고, 화면은 받은 응답을 이 스키마로 확인합니다.
const PlanIdSchema = z.enum(PLAN_IDS);

export const SubscriptionDataSchema: z.ZodMiniType<SubscriptionData> = z.object({
  subscription: z.nullable(
    z.object({
      plan: PlanIdSchema,
      pendingPlan: z.nullable(PlanIdSchema),
      status: z.enum(['active', 'expired']),
      cancelAtPeriodEnd: z.boolean(),
      startedAt: z.string(),
      currentPeriodEnd: z.string(),
    }),
  ),
  payments: z.array(
    z.object({
      id: z.string(),
      plan: PlanIdSchema,
      amount: z.number(),
      kind: z.enum(['new', 'renewal', 'upgrade']),
      status: z.enum(['paid', 'failed']),
      createdAt: z.string(),
    }),
  ),
});
