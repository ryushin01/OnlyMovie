import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/shared/lib/test/fakeApi';
import { renderWithProviders } from '@/shared/lib/test/renderWithProviders';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('시네필 소개와 대표작, 작품 줄을 보여 준다', async () => {
    installFakeApi();
    await renderWithProviders(<HomePage />);
    // 제목은 불러오는 동안에도 있으므로 대표작이 도착하기를 먼저 기다립니다.
    expect(await screen.findByRole('heading', { level: 2, name: '마지막 상영' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /시네필을 위한 영화 전문 OTT/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '국내 첫 공개' })).toBeInTheDocument();
    expect(
      // 화면 낭독기 전용 글자는 position: absolute라 블록으로 계산되어, 브라우저에 따라 앞에 공백이 들어갑니다.
      screen.getByRole('link', { name: /^자세히 보기 ?: 마지막 상영$/ }),
    ).toHaveAttribute('href', '/movies/last-screening');
  });

  it('회원에게는 이어 보기와 남은 시간, 찜한 영화를 보여 준다', async () => {
    const { state } = installFakeApi();
    state.progress['last-screening'] = 600;
    state.watchlist = ['last-screening'];
    await renderWithProviders(<HomePage />);
    const watching = await screen.findByRole('region', { name: '이어 보기' });
    expect(watching).toHaveTextContent('1시간 42분 남음');
    expect(screen.getByRole('region', { name: '찜한 영화' })).toHaveTextContent('마지막 상영');
  });

  it('방문자에게는 회원 줄이 없다', async () => {
    const { state } = installFakeApi({ user: null });
    await renderWithProviders(<HomePage />);
    await screen.findByRole('region', { name: '국내 첫 공개' });
    expect(screen.queryByRole('region', { name: '이어 보기' })).not.toBeInTheDocument();
    expect(state.calls.some((call) => call.path === '/api/library')).toBe(false);
  });

  it('불러오는 동안 제목과 안내, 스켈레톤을 보여 준다', async () => {
    const { state } = installFakeApi();
    state.hold = new Promise(() => {});
    const { container } = await renderWithProviders(<HomePage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /시네필을 위한 영화 전문 OTT/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('영화를 불러오는 중입니다.');
    expect(container.querySelector('[data-skeleton="card"]')).toBeInTheDocument();
  });

  it('장르 링크는 리스트의 필터로 간다', async () => {
    installFakeApi();
    await renderWithProviders(<HomePage />);
    const nav = await screen.findByRole('navigation', { name: '장르별 영화' });
    expect(nav.querySelector('a[href="/movies?genre=SF"]')).toBeInTheDocument();
  });

  it('불러오지 못하면 안내한다', async () => {
    const { state } = installFakeApi();
    state.fail = () => true;
    await renderWithProviders(<HomePage />);
    expect(await screen.findByRole('alert', {}, { timeout: 2000 })).toHaveTextContent('불러오지 못했습니다');
  });

  it('작품이 없으면 안내한다', async () => {
    installFakeApi({ movies: [] });
    await renderWithProviders(<HomePage />);
    expect(await screen.findByRole('heading', { name: '아직 공개된 영화가 없습니다' })).toBeInTheDocument();
  });
});
