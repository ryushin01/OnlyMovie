import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/shared/lib/test/fakeApi';
import { renderWithProviders } from '@/shared/lib/test/renderWithProviders';
import { DeleteAccountButton } from './DeleteAccountButton';

const auth = vi.hoisted(() => ({ logout: vi.fn() }));
vi.mock('@netlify/identity', () => auth);

const deletes = (state: ReturnType<typeof installFakeApi>['state']) =>
  state.calls.filter((call) => call.method === 'DELETE' && call.path === '/api/account');

describe('DeleteAccountButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('확인을 취소하면 요청하지 않는다', async () => {
    const { state } = installFakeApi();
    vi.stubGlobal('confirm', () => false);
    const onDone = vi.fn();
    await renderWithProviders(<DeleteAccountButton onDone={onDone} />);
    await userEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }));
    expect(deletes(state)).toHaveLength(0);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('탈퇴하면 완료를 알린다. 브라우저 로그아웃이 실패해도 끝낸다', async () => {
    const { state } = installFakeApi();
    vi.stubGlobal('confirm', () => true);
    auth.logout.mockRejectedValue(new Error('이미 없는 계정'));
    const onDone = vi.fn();
    await renderWithProviders(<DeleteAccountButton onDone={onDone} />);
    await userEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(deletes(state)).toHaveLength(1);
  });

  it('실패하면 안내하고, 초점은 버튼에 남기며 다시 시도할 수 있다', async () => {
    const { state } = installFakeApi();
    state.fail = (method) => method === 'DELETE';
    vi.stubGlobal('confirm', () => true);
    const onDone = vi.fn();
    await renderWithProviders(<DeleteAccountButton onDone={onDone} />);
    await userEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('탈퇴하지 못했습니다'));
    expect(screen.getByRole('button', { name: '회원 탈퇴' })).toHaveFocus();
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '회원 탈퇴' })).toBeEnabled();
  });
});
