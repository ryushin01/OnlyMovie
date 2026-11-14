import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { installFakeApi, renderWithProviders } from '@/shared/lib/test';
import { RemoveProgressButton } from './RemoveProgressButton';

const view = () => renderWithProviders(<RemoveProgressButton movieId="a" title="마지막 상영" />);
const button = () => screen.findByRole('button', { name: '마지막 상영 이어 보기에서 지우기' });

it('두 번 눌러도 한 번만 지운다', async () => {
  const { state } = installFakeApi();
  await view();
  await userEvent.dblClick(await button());
  await waitFor(() => expect(state.calls.some((call) => call.method === 'DELETE')).toBe(true));
  expect(state.calls.filter((call) => call.method === 'DELETE')).toHaveLength(1);
});

it('실패하면 글자로 알린다', async () => {
  const { state } = installFakeApi();
  state.fail = (method) => method === 'DELETE';
  await view();
  await userEvent.click(await button());
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('지우지 못했습니다'));
});
