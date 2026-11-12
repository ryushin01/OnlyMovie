import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Movie } from '../model/types';
import { useMovies, useSaveProgress } from './queries';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('useSaveProgress', () => {
  it('저장을 겹치지 않게 순서대로 보내 오래된 위치가 덮어쓰지 않는다', async () => {
    const sent: unknown[] = [];
    const releases: (() => void)[] = [];
    vi.stubGlobal('fetch', (_path: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)).positionSeconds);
      return new Promise<Response>((resolve) => {
        releases.push(() => resolve(new Response(null, { status: 204 })));
      });
    });
    const { result } = renderHook(() => useSaveProgress(), { wrapper });

    act(() => {
      result.current.mutate({ id: 'a', positionSeconds: 10 });
      result.current.mutate({ id: 'a', positionSeconds: 20 });
    });
    await waitFor(() => expect(sent).toEqual([10]));

    act(() => releases[0]());
    await waitFor(() => expect(sent).toEqual([10, 20]));
    act(() => releases[1]());
  });
});

describe('useMovies', () => {
  const movie: Movie = {
    id: 'a',
    title: '제목',
    originalTitle: 'Title',
    year: 2025,
    country: '프랑스',
    language: '프랑스어',
    genres: ['드라마'],
    director: '감독',
    writer: '작가',
    cast: [],
    runtimeMinutes: 100,
    ageRating: '12',
    advisories: [],
    moods: [],
    audioLanguages: ['프랑스어'],
    subtitleLanguages: ['한국어'],
    synopsis: '',
    importNote: '',
    firstImport: false,
    releasedOn: '2026-01-01',
    poster: '/p.svg',
    backdrop: '/b.svg',
  };
  const stub = () =>
    vi.stubGlobal('fetch', (path: string) =>
      path.includes('genre=A')
        ? Promise.resolve(Response.json({ items: [movie], total: 1, page: 1, pageSize: 24 }))
        : new Promise<Response>(() => {}),
    );

  it('기본으로는 조건이 바뀌면 이전 결과를 보여 주지 않는다', async () => {
    stub();
    const { result, rerender } = renderHook(({ genre }) => useMovies({ genre }), {
      wrapper,
      initialProps: { genre: 'A' as never },
    });
    await waitFor(() => expect(result.current.data?.total).toBe(1));
    rerender({ genre: 'B' as never });
    expect(result.current.data).toBeUndefined();
  });

  it('요청하면 조건이 바뀌는 동안 이전 결과를 유지한다', async () => {
    stub();
    const { result, rerender } = renderHook(({ genre }) => useMovies({ genre }, { keepPrevious: true }), {
      wrapper,
      initialProps: { genre: 'A' as never },
    });
    await waitFor(() => expect(result.current.data?.total).toBe(1));
    rerender({ genre: 'B' as never });
    expect(result.current.data?.total).toBe(1);
  });
});
