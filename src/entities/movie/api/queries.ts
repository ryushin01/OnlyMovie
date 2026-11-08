import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/request';
import type { MovieFilters } from '../model/filters';
import {
  getFacets,
  getHome,
  getLibrary,
  getMovie,
  getPlayback,
  markAlertsRead,
  removeProgress,
  saveProgress,
  searchMovies,
  setReleaseAlert,
  setWatchlisted,
} from './movieApi';

export const useHome = () => useQuery({ queryKey: ['home'], queryFn: getHome });

export const useMovies = (filters: MovieFilters, { keepPrevious = false } = {}) =>
  useQuery({
    queryKey: ['movies', filters],
    queryFn: () => searchMovies(filters),
    // 리스트에서 조건을 바꾸는 동안 결과가 비어 화면이 튀지 않게 합니다. 다른 작품의 결과를 보여 주면 안 되는 곳에서는 쓰지 않습니다.
    placeholderData: keepPrevious ? keepPreviousData : undefined,
  });

export const useMovie = (id: string) => useQuery({ queryKey: ['movie', id], queryFn: () => getMovie(id) });

export const useMovieFacets = () =>
  useQuery({ queryKey: ['movie-facets'], queryFn: getFacets, staleTime: 5 * 60 * 1000 });

/** 권한은 이용권이 바뀌면 달라지므로 저장해 두지 않습니다. 권한 없음은 다시 시도하지 않습니다. */
export const usePlayback = (id: string) =>
  useQuery({
    queryKey: ['playback', id],
    queryFn: () => getPlayback(id),
    gcTime: 0,
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
  });

const LIBRARY = 'library';

/** 회원마다 따로 저장해, 로그아웃 뒤 다른 회원에게 이전 목록이 보이지 않게 합니다. */
export const useLibrary = (userId: string | undefined) =>
  useQuery({ queryKey: [LIBRARY, userId], queryFn: getLibrary, enabled: Boolean(userId) });

export function useToggleWatchlist() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) => setWatchlisted(id, saved),
    onSuccess: () => client.invalidateQueries({ queryKey: [LIBRARY] }),
  });
}

export function useToggleReleaseAlert() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) => setReleaseAlert(id, saved),
    onSuccess: () => client.invalidateQueries({ queryKey: [LIBRARY] }),
  });
}

export function useMarkAlertsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: markAlertsRead,
    onSuccess: () => client.invalidateQueries({ queryKey: [LIBRARY] }),
  });
}

export function useRemoveProgress() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: removeProgress,
    onSuccess: () => client.invalidateQueries({ queryKey: [LIBRARY] }),
  });
}

export function useSaveProgress() {
  const client = useQueryClient();
  return useMutation({
    // 주기 저장과 멈출 때의 저장이 겹치면 오래된 위치가 나중에 도착할 수 있어 순서대로 보냅니다.
    scope: { id: 'save-progress' },
    mutationFn: ({ id, positionSeconds }: { id: string; positionSeconds: number }) =>
      saveProgress(id, positionSeconds),
    onSuccess: () => client.invalidateQueries({ queryKey: [LIBRARY] }),
  });
}
