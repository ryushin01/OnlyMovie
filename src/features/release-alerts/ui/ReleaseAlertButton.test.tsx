import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { installFakeApi, renderWithProviders } from '@/shared/lib/test';
import { ReleaseAlertButton } from './ReleaseAlertButton';

const view = () => renderWithProviders(<ReleaseAlertButton movieId="last-screening" />);

it('방문자는 로그인으로 보낸다', async () => {
  installFakeApi({ user: null });
  await view();
  const link = await screen.findByRole('link', { name: '공개 알림 받기' });
  expect(link.getAttribute('href')).toContain('/login');
});

it('신청하면 눌린 상태가 되고, 빠르게 두 번 눌러도 요청은 한 번이다', async () => {
  const { state } = installFakeApi();
  await view();
  const button = await screen.findByRole('button', { name: '공개 알림 받기' });
  expect(button).toHaveAttribute('aria-pressed', 'false');
  let release = () => {};
  state.hold = new Promise((resolve) => {
    release = resolve;
  });
  await userEvent.dblClick(button);
  release();
  await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
  expect(state.calls.filter((call) => call.method === 'PUT')).toHaveLength(1);
});

it('실패를 글자로 알린다', async () => {
  const { state } = installFakeApi();
  state.fail = (method) => method === 'PUT';
  await view();
  await userEvent.click(await screen.findByRole('button', { name: '공개 알림 받기' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('바꾸지 못했습니다'));
});
