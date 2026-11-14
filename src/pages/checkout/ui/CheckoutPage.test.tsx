import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { activeSubscription, installFakeApi, renderWithProviders, Where } from '@/shared/lib/test';
import { CheckoutPage } from './CheckoutPage';

const view = (plan = 'standard') =>
  renderWithProviders({ '/checkout/$plan': <CheckoutPage />, '*': <Where /> }, `/checkout/${plan}`);

describe('CheckoutPage', () => {
  it('가상 결제임을 알리고, 결제하면 내 계정으로 간다', async () => {
    installFakeApi();
    await view();
    expect(await screen.findByRole('heading', { level: 1, name: '스탠다드 이용권' })).toBeInTheDocument();
    expect(screen.getByText(/카드 정보를 받지 않습니다/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '10,900원 가상 결제' }));
    expect(await screen.findByText('위치: /account')).toBeInTheDocument();
  });

  it('로그인하지 않으면 돌아올 주소와 함께 로그인으로 보낸다', async () => {
    installFakeApi({ user: null });
    await view();
    expect(await screen.findByText('위치: /login?next=/checkout/standard')).toBeInTheDocument();
  });

  it('이미 이용 중이면 내 계정으로 보낸다', async () => {
    installFakeApi({ subscription: activeSubscription('basic') });
    await view();
    expect(await screen.findByText('위치: /account')).toBeInTheDocument();
  });

  it('없는 이용권을 안내한다', async () => {
    installFakeApi();
    await view('none');
    expect(screen.getByRole('heading', { name: '이용권을 찾을 수 없습니다' })).toBeInTheDocument();
  });
});
