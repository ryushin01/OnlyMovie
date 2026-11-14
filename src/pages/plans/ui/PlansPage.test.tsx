import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { activeSubscription, installFakeApi, renderWithProviders } from '@/shared/lib/test';
import { PlansPage } from './PlansPage';

describe('PlansPage', () => {
  it('이용권 세 가지와 혜택 차이를 보여 준다', async () => {
    installFakeApi({ user: null });
    await renderWithProviders(<PlansPage />);
    expect(screen.getByText('월 7,900원')).toBeInTheDocument();
    expect(screen.getByText('국내 첫 공개작을 뺀 영화')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '스탠다드 시작하기' })).toHaveAttribute(
      'href',
      '/checkout/standard',
    );
  });

  it('이용 중이면 내 계정으로 안내한다', async () => {
    installFakeApi({ subscription: activeSubscription('standard') });
    await renderWithProviders(<PlansPage />);
    expect(await screen.findByRole('link', { name: '이용 중인 스탠다드 관리' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(screen.getByRole('link', { name: '프리미엄(으)로 변경' })).toHaveAttribute('href', '/account');
  });
});
