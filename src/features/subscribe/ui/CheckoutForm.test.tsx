import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PLANS } from '@/entities/subscription';
import { installFakeApi } from '@/shared/lib/test/fakeApi';
import { renderWithProviders } from '@/shared/lib/test/renderWithProviders';
import { CheckoutForm } from './CheckoutForm';

describe('CheckoutForm', () => {
  it('보낼 데이터를 그대로 넘기고 성공하면 완료를 알린다', async () => {
    const { state } = installFakeApi();
    const onDone = vi.fn();
    await renderWithProviders(<CheckoutForm plan={PLANS.standard} onDone={onDone} />);

    await userEvent.click(screen.getByRole('button', { name: '10,900원 가상 결제' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(state.calls.find((call) => call.method === 'POST')?.body).toEqual({
      plan: 'standard',
      simulateFailure: false,
    });
  });

  it('결제 실패를 고르면 안내하고, 초점은 결제 버튼에 남긴다', async () => {
    const user = userEvent.setup();
    installFakeApi();
    const onDone = vi.fn();
    await renderWithProviders(<CheckoutForm plan={PLANS.basic} onDone={onDone} />);

    await user.click(screen.getByRole('radio', { name: '결제 실패' }));
    await user.click(screen.getByRole('button', { name: '7,900원 가상 결제' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('가상 결제에 실패했습니다'));
    expect(screen.getByRole('button', { name: '7,900원 가상 결제' })).toHaveFocus();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('빠르게 두 번 눌러도 한 번만 요청한다', async () => {
    const { state } = installFakeApi();
    let release = () => {};
    state.hold = new Promise((resolve) => {
      release = resolve;
    });
    await renderWithProviders(<CheckoutForm plan={PLANS.basic} onDone={() => {}} />);
    await userEvent.dblClick(screen.getByRole('button', { name: '7,900원 가상 결제' }));
    release();
    await waitFor(() => expect(state.calls.filter((call) => call.method === 'POST')).toHaveLength(1));
  });

  it('결제 중에는 중복 제출을 막는다', async () => {
    const { state } = installFakeApi();
    let release = () => {};
    state.hold = new Promise((resolve) => {
      release = resolve;
    });
    await renderWithProviders(<CheckoutForm plan={PLANS.basic} onDone={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: '7,900원 가상 결제' }));

    // disabled 대신 aria-disabled로 막아, 초점이 버튼에 남습니다.
    const button = await screen.findByRole('button', { name: '결제 중…' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveFocus();
    release();
  });
});
