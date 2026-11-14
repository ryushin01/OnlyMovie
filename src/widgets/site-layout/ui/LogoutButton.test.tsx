import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSession } from '@/entities/session';
import { LogoutButton } from './LogoutButton';

const auth = vi.hoisted(() => ({ logout: vi.fn() }));
vi.mock('@netlify/identity', () => auth);

function Status() {
  const { user } = useSession();
  return <p>{user ? '회원' : '방문자'}</p>;
}

async function renderAsMember() {
  const fetchMock = vi.fn(async () =>
    Response.json({ user: { id: 'u1', email: 'a@example.com', name: null } }),
  );
  vi.stubGlobal('fetch', fetchMock);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Status />
      <LogoutButton />
    </QueryClientProvider>,
  );
  await screen.findByText('회원');
  return fetchMock;
}

describe('LogoutButton', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('로그아웃하면 세션 조회가 실패해도 회원 메뉴를 닫는다', async () => {
    const fetchMock = await renderAsMember();
    fetchMock.mockImplementation(async () => new Response('{}', { status: 503 }));
    auth.logout.mockResolvedValue(undefined);

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    await screen.findByText('방문자');
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeEnabled();
  });

  it('로그아웃에 실패하면 서버에 다시 묻고 로그인 상태를 유지한다', async () => {
    const fetchMock = await renderAsMember();
    auth.logout.mockRejectedValue(new Error('로그아웃 실패'));

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByRole('button', { name: '로그아웃' })).toBeEnabled());
    expect(screen.getByText('회원')).toBeInTheDocument();
  });
});
