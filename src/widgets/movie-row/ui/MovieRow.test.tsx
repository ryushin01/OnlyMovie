import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import type { Movie } from '@/entities/movie';
import { renderWithProviders, sampleMovie } from '@/shared/lib/test';
import { routes } from '@/shared/config';
import { MovieRow } from './MovieRow';

it('MovieRow는 줄 제목으로 영역 이름을 정하고 전체 보기로 잇는다', async () => {
  await renderWithProviders(
    <MovieRow
      title="국내 첫 공개"
      movies={[sampleMovie() as unknown as Movie]}
      moreTo={routes.movies({ firstImport: 'true' })}
    />,
  );
  expect(await screen.findByRole('region', { name: '국내 첫 공개' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '국내 첫 공개 전체 보기' })).toHaveAttribute(
    'href',
    '/movies?firstImport=true',
  );
  expect(screen.getByRole('link', { name: '마지막 상영' })).toBeInTheDocument();
});
