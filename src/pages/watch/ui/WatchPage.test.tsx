import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { activeSubscription, installFakeApi, renderWithProviders } from '@/shared/lib/test';
import { WatchPage } from './WatchPage';

const view = (id = 'last-screening') =>
  renderWithProviders({ '/watch/$id': <WatchPage />, '/login': <p>로그인 화면</p> }, `/watch/${id}`);

describe('WatchPage', () => {
  it('권한이 있으면 자동 재생 없이 플레이어를 보여 준다', async () => {
    installFakeApi({ subscription: activeSubscription('standard') });
    await view();
    expect(await screen.findByRole('heading', { level: 1, name: '마지막 상영' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '재생' })).toBeInTheDocument();
    expect(screen.getByText('0:00:00 / 1:52:00')).toBeInTheDocument();
    expect(screen.getByText('FHD')).toBeInTheDocument();
  });

  it('재생 위치를 옮기고 자막과 음소거를 켜고 끈다', async () => {
    const user = userEvent.setup();
    installFakeApi({ subscription: activeSubscription('standard') });
    await view();
    const seek = await screen.findByRole('slider', { name: '재생 위치' });
    fireEvent.change(seek, { target: { value: '60' } });
    expect(screen.getByText('0:01:00 / 1:52:00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '재생' }));
    expect(screen.getByRole('button', { name: '일시정지' })).toBeInTheDocument();

    const subtitles = screen.getByRole('button', { name: '자막' });
    expect(subtitles).toHaveAttribute('aria-pressed', 'true');
    await user.click(subtitles);
    expect(subtitles).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(/가상 자막/)).not.toBeInTheDocument();
    await act(async () => {});
  });

  it('끝까지 본 뒤 재생을 누르면 처음부터 다시 시작한다', async () => {
    const user = userEvent.setup();
    installFakeApi({ subscription: activeSubscription('standard') });
    await view();
    const seek = await screen.findByRole('slider', { name: '재생 위치' });
    fireEvent.change(seek, { target: { value: String(112 * 60) } });
    expect(screen.getByText('1:52:00 / 1:52:00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '재생' }));

    expect(screen.getByText('0:00:00 / 1:52:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '일시정지' })).toBeInTheDocument();
  });

  it('재생하면 기기 자리를 잡고, 멈추면 돌려준다', async () => {
    const user = userEvent.setup();
    const { state } = installFakeApi({ subscription: activeSubscription('standard') });
    await view();
    await user.click(await screen.findByRole('button', { name: '재생' }));
    await user.click(screen.getByRole('button', { name: '일시정지' }));
    const screenCalls = () =>
      state.calls.filter((call) => call.path.includes('/playback?device=')).map((call) => call.method);
    await waitFor(() => expect(screenCalls()).toEqual(['PUT', 'DELETE']));
  });

  it('자리를 잡는 요청이 끝난 뒤에 돌려주어, 늦은 요청이 자리를 다시 차지하지 않는다', async () => {
    const user = userEvent.setup();
    const { state } = installFakeApi({ subscription: activeSubscription('standard') });
    await view();
    const play = await screen.findByRole('button', { name: '재생' });
    let release = () => {};
    state.hold = new Promise((resolve) => {
      release = resolve;
    });
    await user.click(play);
    await user.click(screen.getByRole('button', { name: '일시정지' }));
    const screenCalls = () =>
      state.calls.filter((call) => call.path.includes('/playback?device=')).map((call) => call.method);
    expect(screenCalls()).toEqual(['PUT']);

    release();
    state.hold = null;
    await waitFor(() => expect(screenCalls()).toEqual(['PUT', 'DELETE']));
  });

  it('동시 시청 대수를 넘으면 멈추고 글자로 알린다', async () => {
    const user = userEvent.setup();
    const { state } = installFakeApi({ subscription: activeSubscription('basic') });
    state.screensFull = true;
    await view();
    await user.click(await screen.findByRole('button', { name: '재생' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('동시 시청 대수'));
    expect(screen.getByRole('button', { name: '재생' })).toBeInTheDocument();
  });

  it('지난번 위치에서 시작하고, 일시정지하면 위치를 저장한다', async () => {
    const user = userEvent.setup();
    const { state } = installFakeApi({ subscription: activeSubscription('standard') });
    state.progress['last-screening'] = 600;
    await view();
    expect(await screen.findByText('0:10:00 / 1:52:00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '재생' }));
    await user.click(screen.getByRole('button', { name: '일시정지' }));

    await waitFor(() =>
      expect(state.calls.some((call) => call.path === '/api/library/progress/last-screening')).toBe(true),
    );
    expect(state.progress['last-screening']).toBeGreaterThanOrEqual(600);
  });

  it('끝까지 재생되면 멈추고, 다시 누르면 처음부터 시작한다', async () => {
    const user = userEvent.setup();
    const { state } = installFakeApi({ subscription: activeSubscription('standard') });
    state.progress['last-screening'] = 112 * 60 - 1;
    await view();
    await user.click(await screen.findByRole('button', { name: '재생' }));
    expect(await screen.findByText('1:52:00 / 1:52:00', {}, { timeout: 2500 })).toBeInTheDocument();
    const replay = screen.getByRole('button', { name: '재생' });
    await user.click(replay);
    expect(screen.getByText('0:00:00 / 1:52:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '일시정지' })).toBeInTheDocument();
  });

  it('로그인하지 않으면 로그인 화면으로 보낸다', async () => {
    installFakeApi({ user: null });
    await view();
    expect(await screen.findByText('로그인 화면')).toBeInTheDocument();
  });

  it('이용권이 없으면 안내한다', async () => {
    installFakeApi();
    await view();
    expect(await screen.findByRole('heading', { name: '이용권이 필요합니다' })).toBeInTheDocument();
  });

  it('없는 작품을 안내한다', async () => {
    installFakeApi();
    await view('none');
    expect(await screen.findByRole('heading', { name: '영화를 찾을 수 없습니다' })).toBeInTheDocument();
  });
});
