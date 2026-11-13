import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import type { MemberLibrary, Movie } from '@/entities/movie';
import { sampleMovie } from '@/shared/lib/test/fakeApi';
import { renderWithProviders } from '@/shared/lib/test/renderWithProviders';
import { ContinueWatchingRow } from './ContinueWatchingRow';

const library = (continueWatching: MemberLibrary['continueWatching']) =>
  ({ continueWatching, watchlist: [], alerts: [] }) as unknown as MemberLibrary;

it('이어 볼 영화를 남은 시간과 함께 보여 주고, 카드마다 기록 지우기 버튼을 둔다', async () => {
  const movie = sampleMovie() as unknown as Movie;
  await renderWithProviders(
    <ContinueWatchingRow library={library([{ movie, positionSeconds: 60 }])} title="이어 보기" />,
  );
  expect(await screen.findByRole('region', { name: '이어 보기' })).toBeInTheDocument();
  expect(screen.getByText(/남음/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: new RegExp(movie.title) })).toBeInTheDocument();
});

it('볼 영화가 없거나 아직 받지 못했으면 그리지 않는다', async () => {
  const { container } = await renderWithProviders(
    <>
      <ContinueWatchingRow library={undefined} title="이어 보기" />
      <ContinueWatchingRow library={library([])} title="시청 기록" />
    </>,
  );
  expect(container.querySelector('section')).toBeNull();
});
