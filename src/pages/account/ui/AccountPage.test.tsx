import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { activeSubscription, installFakeApi, renderWithProviders } from '@/shared/lib/test';
import { AccountPage } from './AccountPage';

const view = () =>
  renderWithProviders({ '/account': <AccountPage />, '/login': <p>로그인 화면</p> }, '/account');

describe('AccountPage', () => {
  it('이용권이 없으면 이용권 보기로 안내한다', async () => {
    installFakeApi();
    await view();
    expect(await screen.findByRole('heading', { name: '이용 중인 이용권이 없습니다' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '이용권 보기' })).toHaveAttribute('href', '/plans');
    expect(screen.getByText('시네필 · member@example.com')).toBeInTheDocument();
  });

  it('이용 중인 이용권과 결제 내역을 보여 주고, 해지하면 갱신한다', async () => {
    const { state } = installFakeApi({ subscription: activeSubscription('standard') });
    state.payments.push({
      id: 'p1',
      plan: 'standard',
      amount: 10900,
      kind: 'new',
      status: 'paid',
      createdAt: '2026-11-06T00:00:00.000Z',
    });
    vi.stubGlobal('confirm', () => true);
    await view();

    expect(await screen.findByRole('heading', { name: '스탠다드 이용권 이용 중' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '가상 결제 내역' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '10,900원' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '해지하기' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '해지 취소' })).toBeInTheDocument());
  });

  it('로그인하지 않으면 로그인 화면으로 보낸다', async () => {
    installFakeApi({ user: null });
    await view();
    expect(await screen.findByText('로그인 화면')).toBeInTheDocument();
  });
});
