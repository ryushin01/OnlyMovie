import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { activeSubscription, installFakeApi, sampleMovie } from '@/shared/lib/test/fakeApi';
import { renderWithProviders } from '@/shared/lib/test/renderWithProviders';
import { MemberPanel } from './MemberPanel';

it('방문자에게는 이용권을 안내한다', async () => {
  installFakeApi({ user: null });
  await renderWithProviders(<MemberPanel />);
  expect(await screen.findByRole('link', { name: '이용권 둘러보기' })).toHaveAttribute('href', '/plans');
});

it('회원에게는 이용권과 남은 날, 찜 바로가기를 보여 준다', async () => {
  const { state } = installFakeApi({ subscription: activeSubscription('standard'), movies: [sampleMovie()] });
  state.watchlist = ['last-screening'];
  await renderWithProviders(<MemberPanel />);
  expect(await screen.findByText('스탠다드 이용 중')).toBeInTheDocument();
  expect(screen.getByText(/다음 결제까지 \d+일/)).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: '마지막 상영' })).toBeInTheDocument();
});
