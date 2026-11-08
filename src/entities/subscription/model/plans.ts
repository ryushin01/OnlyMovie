export const PLAN_IDS = ['basic', 'standard', 'premium'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export interface Plan {
  id: PlanId;
  name: string;
  /** 월 요금 (원) */
  price: number;
  quality: string;
  screens: number;
  /** 국내 첫 공개작을 볼 수 있는지 */
  firstImports: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  basic: { id: 'basic', name: '베이직', price: 7900, quality: 'HD', screens: 1, firstImports: false },
  standard: {
    id: 'standard',
    name: '스탠다드',
    price: 10900,
    quality: 'FHD',
    screens: 2,
    firstImports: true,
  },
  premium: { id: 'premium', name: '프리미엄', price: 13900, quality: '4K', screens: 4, firstImports: true },
};

export const isPlanId = (value: unknown): value is PlanId => PLAN_IDS.includes(value as PlanId);

export const isUpgrade = (from: PlanId, to: PlanId) => PLANS[to].price > PLANS[from].price;

export const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

export interface Subscription {
  plan: PlanId;
  pendingPlan: PlanId | null;
  status: 'active' | 'expired';
  cancelAtPeriodEnd: boolean;
  startedAt: string;
  currentPeriodEnd: string;
}

export interface Payment {
  id: string;
  plan: PlanId;
  amount: number;
  kind: 'new' | 'renewal' | 'upgrade';
  status: 'paid' | 'failed';
  createdAt: string;
}

export interface SubscriptionData {
  subscription: Subscription | null;
  payments: Payment[];
}

export type WatchBlock = 'not_released' | 'login_required' | 'plan_required' | 'upgrade_required';

/**
 * 볼 수 없는 이유를 돌려줍니다. 볼 수 있으면 null입니다.
 * 화면의 안내와 서버의 재생 권한 확인이 같은 규칙을 씁니다.
 */
export function watchBlock(
  movie: { firstImport: boolean; released: boolean },
  { loggedIn, plan }: { loggedIn: boolean; plan: PlanId | null },
): WatchBlock | null {
  if (!movie.released) return 'not_released';
  if (!loggedIn) return 'login_required';
  if (!plan) return 'plan_required';
  if (movie.firstImport && !PLANS[plan].firstImports) return 'upgrade_required';
  return null;
}

/** 해지가 예약되어도 결제 기간이 끝날 때까지는 볼 수 있습니다. */
export const activePlan = (subscription: Subscription | null | undefined): PlanId | null =>
  subscription?.status === 'active' ? subscription.plan : null;

const DAY_MS = 86_400_000;

/** 이번 결제 주기(종료일에서 달력으로 한 달 전부터)에서 남은 날과 남은 비율입니다. */
export function periodProgress(endIso: string, now: Date) {
  const end = new Date(endIso);
  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - 1);
  const left = Math.max(0, end.getTime() - now.getTime());
  return { days: Math.ceil(left / DAY_MS), ratio: Math.min(1, left / (end.getTime() - start.getTime())) };
}
