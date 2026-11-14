import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderWithProviders, sampleMovie } from '@/shared/lib/test';
import type { Movie } from '../model/types';
import { MovieCard } from './MovieCard';

const render = (patch: Partial<Movie>) =>
  renderWithProviders(<MovieCard movie={{ ...(sampleMovie() as unknown as Movie), ...patch }} />);

it('상세로 가는 링크와 포스터 설명이 있다', async () => {
  await render({ firstImport: false });
  expect(await screen.findByRole('link', { name: '마지막 상영' })).toHaveAttribute(
    'href',
    '/movies/last-screening',
  );
  expect(screen.getByAltText('마지막 상영 포스터')).toBeInTheDocument();
  expect(screen.queryByText('국내 첫 공개')).not.toBeInTheDocument();
});

it('국내 첫 공개작과 공개 예정작을 글자로 구분한다', async () => {
  await render({ firstImport: true });
  expect(await screen.findByText('국내 첫 공개')).toBeInTheDocument();
});

it('가로형 카드는 배경 이미지를 장식으로 쓰고 작품 이름은 링크가 전한다', async () => {
  const movie = sampleMovie() as unknown as Movie;
  const { container } = await renderWithProviders(<MovieCard movie={movie} wide />);
  await screen.findByRole('link', { name: '마지막 상영' });
  expect(container.querySelector('img')).toHaveAttribute('src', movie.backdrop);
  expect(container.querySelector('img')).toHaveAttribute('alt', '');
});

it('본 비율을 막대로 그리고 100%를 넘기지 않는다', async () => {
  const movie = sampleMovie() as unknown as Movie;
  const { container } = await renderWithProviders(<MovieCard movie={movie} wide progress={1.4} />);
  await screen.findByRole('link', { name: '마지막 상영' });
  expect(container.querySelector<HTMLElement>('[style]')?.style.width).toBe('100%');
});

it('공개 예정작에는 공개일을 보여 준다', async () => {
  await render({ firstImport: true, releasedOn: '2999-01-15' });
  expect(await screen.findByText('2999.01.15 공개')).toBeInTheDocument();
});
