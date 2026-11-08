import { describe, expect, it } from 'vitest';
import { activePlan, isUpgrade, periodProgress, watchBlock, type Subscription } from './plans';

const released = { firstImport: false, released: true };
const firstImport = { firstImport: true, released: true };
const member = (plan: 'basic' | 'standard' | 'premium' | null) => ({ loggedIn: true, plan });

describe('watchBlock', () => {
  it('공개 전 작품은 누구도 볼 수 없다', () => {
    expect(watchBlock({ firstImport: true, released: false }, member('premium'))).toBe('not_released');
  });
  it('로그인과 이용권을 차례로 요구한다', () => {
    expect(watchBlock(released, { loggedIn: false, plan: null })).toBe('login_required');
    expect(watchBlock(released, member(null))).toBe('plan_required');
    expect(watchBlock(released, member('basic'))).toBeNull();
  });
  it('국내 첫 공개작은 스탠다드부터 볼 수 있다', () => {
    expect(watchBlock(firstImport, member('basic'))).toBe('upgrade_required');
    expect(watchBlock(firstImport, member('standard'))).toBeNull();
    expect(watchBlock(firstImport, member('premium'))).toBeNull();
  });
});

describe('activePlan', () => {
  const subscription: Subscription = {
    plan: 'standard',
    pendingPlan: null,
    status: 'active',
    cancelAtPeriodEnd: true,
    startedAt: '2026-11-01T00:00:00.000Z',
    currentPeriodEnd: '2026-12-01T00:00:00.000Z',
  };
  it('해지 예약 중에는 이용권이 살아 있고 만료되면 없다', () => {
    expect(activePlan(subscription)).toBe('standard');
    expect(activePlan({ ...subscription, status: 'expired' })).toBeNull();
    expect(activePlan(null)).toBeNull();
  });
});

it('요금이 더 높으면 상위 이용권이다', () => {
  expect(isUpgrade('basic', 'premium')).toBe(true);
  expect(isUpgrade('premium', 'standard')).toBe(false);
});

describe('periodProgress', () => {
  it('달력의 한 달을 기준으로 남은 날과 비율을 계산한다', () => {
    const { days, ratio } = periodProgress('2026-12-06T00:00:00.000Z', new Date('2026-11-21T00:00:00.000Z'));
    expect(days).toBe(15);
    expect(ratio).toBeCloseTo(0.5);
  });

  it('지난 기간은 0으로 멈춘다', () => {
    expect(periodProgress('2026-11-01T00:00:00.000Z', new Date('2026-11-21T00:00:00.000Z'))).toEqual({
      days: 0,
      ratio: 0,
    });
  });
});
