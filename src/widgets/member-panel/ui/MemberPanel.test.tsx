import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { activeSubscription, installFakeApi, sampleMovie } from '@/shared/lib/test/fakeApi';
import { renderWithProviders } from '@/shared/lib/test/renderWithProviders';
import { MemberPanel } from './MemberPanel';

// 패널은 1440px 이상에서만 보입니다. jsdom은 창 너비가 1024px로 고정이라 미디어 쿼리로 숨겨지므로,
// 링크는 숨겨진 요소까지 포함해 찾습니다.
const includeHidden = { hidden: true } as const;

it('방문자에게는 이용권을 안내한다', async () => {
  installFakeApi({ user: null });
  await renderWithProviders(<MemberPanel />);
  expect(await screen.findByRole('link', { ...includeHidden, name: '이용권 둘러보기' })).toHaveAttribute(
    'href',
    '/plans',
  );
});

it('회원에게는 이용권과 남은 날, 찜 바로가기를 보여 준다', async () => {
  const { state } = installFakeApi({ subscription: activeSubscription('standard'), movies: [sampleMovie()] });
  state.watchlist = ['last-screening'];
  await renderWithProviders(<MemberPanel />);
  expect(await screen.findByText('스탠다드 이용 중')).toBeInTheDocument();
  expect(screen.getByText(/다음 결제까지 \d+일/)).toBeInTheDocument();
  expect(await screen.findByRole('link', { ...includeHidden, name: '마지막 상영' })).toBeInTheDocument();
});

it('이미 공개되어 확인한 알림은 다가오는 공개에 넣지 않는다', async () => {
  const { state } = installFakeApi({
    movies: [sampleMovie(), sampleMovie({ id: 'future', title: '먼 훗날', releasedOn: '2999-01-15' })],
  });
  state.alerts = ['last-screening', 'future'];
  state.alertsRead = ['last-screening'];
  await renderWithProviders(<MemberPanel />);
  expect(await screen.findByRole('link', { ...includeHidden, name: '먼 훗날' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { ...includeHidden, name: '마지막 상영' })).not.toBeInTheDocument();
});
