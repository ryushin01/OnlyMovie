import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { installFakeApi, renderWithProviders, sampleMovie } from '@/shared/lib/test';
import { AlertBell } from './AlertBell';

const view = () => renderWithProviders(<AlertBell />);

it('방문자에게는 보이지 않는다', async () => {
  installFakeApi({ user: null });
  const { container } = await view();
  await waitFor(() => expect(container.querySelector('button')).toBeNull());
});

it('새 소식 수를 이름으로 알리고, Esc로 닫으면 초점을 돌려주고 확인 처리한다', async () => {
  const { state } = installFakeApi({ movies: [sampleMovie()] });
  state.alerts = ['last-screening'];
  await view();
  const bell = await screen.findByRole('button', { name: '공개 알림 새 소식 1건' });
  await userEvent.click(bell);
  expect(bell).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('link', { name: /마지막 상영/ })).toBeVisible();

  await userEvent.keyboard('{Escape}');
  expect(bell).toHaveFocus();
  expect(bell).toHaveAttribute('aria-expanded', 'false');
  await waitFor(() => expect(state.alertsRead).toContain('last-screening'));
});

it('알림이 없으면 안내한다', async () => {
  installFakeApi();
  await view();
  await userEvent.click(await screen.findByRole('button', { name: '공개 알림' }));
  expect(screen.getByText('공개 예정작에서 공개 알림을 신청해 보세요.')).toBeVisible();
});
