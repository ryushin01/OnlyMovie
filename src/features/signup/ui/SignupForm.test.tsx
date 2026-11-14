import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/shared/lib/test/fakeApi';
import { renderWithProviders } from '@/shared/lib/test/renderWithProviders';
import { SignupForm } from './SignupForm';

const auth = vi.hoisted(() => ({ signup: vi.fn() }));
vi.mock('@netlify/identity', () => auth);

async function fill(password = 'password1') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('이름 (필수)'), '시네필');
  await user.type(screen.getByLabelText('이메일 (필수)'), 'cinephile@example.com');
  await user.type(screen.getByLabelText('비밀번호 (필수)'), password);
  await user.click(screen.getByRole('button', { name: '가입하기' }));
}

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installFakeApi();
  });

  it('바로 확인되는 가입은 완료를 알린다', async () => {
    const onDone = vi.fn();
    auth.signup.mockResolvedValue({ confirmedAt: '2026-11-06T00:00:00.000Z' });
    await renderWithProviders(<SignupForm onDone={onDone} />);
    await fill();
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(auth.signup).toHaveBeenCalledWith('cinephile@example.com', 'password1', { full_name: '시네필' });
  });

  it('메일 확인이 필요하면 안내하고, 사라진 버튼 대신 안내 제목으로 초점을 옮긴다', async () => {
    const onDone = vi.fn();
    auth.signup.mockResolvedValue({});
    await renderWithProviders(<SignupForm onDone={onDone} />);
    await fill();
    const heading = await screen.findByRole('heading', { name: '메일을 확인해 주세요' });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText(/cinephile@example.com로 확인 메일을 보냈습니다/)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('짧은 비밀번호는 요청 전에 막고 입력 칸과 오류를 연결한다', async () => {
    await renderWithProviders(<SignupForm onDone={() => {}} />);
    await fill('short');
    expect(await screen.findByText('오류: 비밀번호를 8자 이상 입력해 주세요.')).toBeInTheDocument();
    const input = screen.getByLabelText('비밀번호 (필수)');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(input).toHaveFocus());
    expect(auth.signup).not.toHaveBeenCalled();
  });

  it('가입에 실패하면 안내하고, 초점은 가입 버튼에 남긴다', async () => {
    auth.signup.mockRejectedValue(new Error('duplicate'));
    await renderWithProviders(<SignupForm onDone={() => {}} />);
    await fill();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('가입하지 못했습니다'));
    expect(screen.getByRole('button', { name: '가입하기' })).toHaveFocus();
  });

  it('빠르게 두 번 눌러도 한 번만 가입을 요청한다', async () => {
    let finish = (_value: unknown) => {};
    auth.signup.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const user = userEvent.setup();
    await renderWithProviders(<SignupForm onDone={() => {}} />);
    await user.type(screen.getByLabelText('이름 (필수)'), '시네필');
    await user.type(screen.getByLabelText('이메일 (필수)'), 'cinephile@example.com');
    await user.type(screen.getByLabelText('비밀번호 (필수)'), 'password1');
    await user.dblClick(screen.getByRole('button', { name: '가입하기' }));
    finish({});
    await screen.findByRole('heading', { name: '메일을 확인해 주세요' });
    expect(auth.signup).toHaveBeenCalledOnce();
  });
});
