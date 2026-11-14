import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { movieSearch } from '@/entities/movie';
import { installFakeApi, renderWithProviders, sampleMovie } from '@/shared/lib/test';
import { MovieListPage } from './MovieListPage';

// 앱의 라우터처럼 주소의 조건을 검증해서 넘깁니다.
const page = {
  '/movies': {
    element: <MovieListPage />,
    validateSearch: movieSearch,
  },
};

const movies = [sampleMovie(), sampleMovie({ id: 'iron-harbor', title: '철의 항구', genres: ['액션'] })];

describe('MovieListPage', () => {
  it('주소의 조건으로 찾고 결과 수를 알린다', async () => {
    const { state } = installFakeApi({ movies });
    await renderWithProviders(page, '/movies?genre=%EC%95%A1%EC%85%98');
    expect(await screen.findByText('영화 1편')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '철의 항구' })).toBeInTheDocument();
    expect(state.calls.some((call) => call.path.startsWith('/api/movies?genre='))).toBe(true);
    expect(screen.getByLabelText('장르')).toHaveValue('액션');
  });

  it('필터를 적용하면 다시 찾고, 없으면 안내한다', async () => {
    const user = userEvent.setup();
    installFakeApi({ movies });
    await renderWithProviders(page, '/movies');
    expect(await screen.findByText('영화 2편')).toBeInTheDocument();

    await user.type(screen.getByLabelText('검색어'), '없는 영화');
    await user.click(screen.getByRole('button', { name: '적용' }));

    await waitFor(() => expect(screen.getByText('영화 0편')).toBeInTheDocument());
    expect(screen.getByText(/조건에 맞는 영화가 없습니다/)).toBeInTheDocument();
    expect(screen.getByLabelText('검색어')).toHaveValue('없는 영화');
  });

  it('불러오지 못하면 안내한다', async () => {
    const { state } = installFakeApi({ movies });
    state.fail = (_method, path) => path.startsWith('/api/movies');
    await renderWithProviders(page, '/movies');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('불러오지 못했습니다'), {
      timeout: 2000,
    });
  });
});
