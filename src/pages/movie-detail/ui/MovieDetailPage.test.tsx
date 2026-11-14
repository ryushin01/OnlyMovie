import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { activeSubscription, installFakeApi, renderWithProviders, sampleMovie } from '@/shared/lib/test';
import { MovieDetailPage } from './MovieDetailPage';

const view = (path = '/movies/last-screening') =>
  renderWithProviders({ '/movies/$id': <MovieDetailPage /> }, path);

describe('MovieDetailPage', () => {
  it('다시 불러오기에 실패하면 이전 작품이 남아 있어도 문서 제목이 오류를 따른다', async () => {
    const { state } = installFakeApi();
    const { queryClient } = await view();
    expect(await screen.findByRole('heading', { level: 1, name: '마지막 상영' })).toBeInTheDocument();
    expect(document.title).toBe('마지막 상영 | OnlyMovie');

    state.fail = () => true;
    await act(() => queryClient.refetchQueries({ queryKey: ['movie', 'last-screening'] }));
    expect(
      await screen.findByRole('heading', { level: 1, name: '영화를 불러오지 못했습니다' }),
    ).toBeInTheDocument();
    expect(document.title).toBe('영화를 불러오지 못했습니다 | OnlyMovie');
  });

  it('불러오기에 실패하면 없는 영화라고 하지 않고 문서 제목도 같은 내용을 알린다', async () => {
    const { state } = installFakeApi();
    state.fail = () => true;
    await view();
    expect(
      await screen.findByRole('heading', { level: 1, name: '영화를 불러오지 못했습니다' }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(document.title).toBe('영화를 불러오지 못했습니다 | OnlyMovie');
  });

  it('작품 정보를 보여 주고 사람과 연도는 리스트 필터로 잇는다', async () => {
    installFakeApi();
    await view();
    expect(await screen.findByRole('heading', { level: 1, name: '마지막 상영' })).toBeInTheDocument();
    expect(screen.getByText('Ultima Proiecție')).toBeInTheDocument();
    expect(screen.getByText('12세 이상 관람가', { selector: 'li' })).toBeInTheDocument();
    expect(screen.getByText('1시간 52분 (112분)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '도이나 칼린' })).toHaveAttribute(
      'href',
      `/movies?actor=${encodeURIComponent('도이나 칼린').replaceAll('%20', '+')}`,
    );
    expect(screen.getByRole('link', { name: '2025년' })).toHaveAttribute('href', '/movies?year=2025');
    expect(screen.getByRole('heading', { name: '수입 이야기' })).toBeInTheDocument();
  });

  it('방문자에게는 로그인을 안내하고 돌아올 주소를 넘긴다', async () => {
    installFakeApi({ user: null });
    await view();
    expect(await screen.findByRole('link', { name: '로그인하고 보기' })).toHaveAttribute(
      'href',
      `/login?next=${encodeURIComponent('/movies/last-screening')}`,
    );
  });

  it('이용권이 없으면 이용권 구매로 안내한다', async () => {
    installFakeApi();
    await view();
    expect(await screen.findByRole('link', { name: '이용권 구매하고 보기' })).toHaveAttribute(
      'href',
      '/plans',
    );
  });

  it('베이직은 국내 첫 공개작을 볼 수 없어 이용권 변경을 안내한다', async () => {
    installFakeApi({ subscription: activeSubscription('basic') });
    await view();
    expect(await screen.findByRole('link', { name: '이용권 올리고 보기' })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  it('베이직도 일반 작품은 재생할 수 있다', async () => {
    installFakeApi({
      movies: [sampleMovie({ firstImport: false })],
      subscription: activeSubscription('basic'),
    });
    await view();
    expect(await screen.findByRole('link', { name: '재생' })).toHaveAttribute(
      'href',
      '/watch/last-screening',
    );
  });

  it('스탠다드는 국내 첫 공개작을 재생할 수 있다', async () => {
    installFakeApi({ subscription: activeSubscription('standard') });
    await view();
    expect(await screen.findByRole('link', { name: '재생' })).toBeInTheDocument();
  });

  it('보던 영화는 이어 보기로 안내한다', async () => {
    const { state } = installFakeApi({ subscription: activeSubscription('standard') });
    state.progress['last-screening'] = 600;
    await view();
    expect(await screen.findByRole('link', { name: '이어 보기 (0:10:00부터)' })).toHaveAttribute(
      'href',
      '/watch/last-screening',
    );
  });

  it('같은 장르의 다른 영화를 보여 주고 자기 자신은 뺀다', async () => {
    installFakeApi({ movies: [sampleMovie(), sampleMovie({ id: 'winter-route', title: '겨울의 항로' })] });
    await view();
    const related = await screen.findByRole('region', { name: '비슷한 영화' });
    expect(related).toHaveTextContent('겨울의 항로');
    expect(related).not.toHaveTextContent('마지막 상영');
  });

  it('공개 전 작품은 공개일만 안내한다', async () => {
    installFakeApi({
      movies: [sampleMovie({ releasedOn: '2999-01-15' })],
      subscription: activeSubscription('premium'),
    });
    await view();
    expect(await screen.findByText('2999.01.15 공개 예정')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '재생' })).not.toBeInTheDocument();
  });

  it('없는 작품을 안내한다', async () => {
    installFakeApi();
    await view('/movies/none');
    expect(await screen.findByRole('heading', { name: '영화를 찾을 수 없습니다' })).toBeInTheDocument();
  });
});
