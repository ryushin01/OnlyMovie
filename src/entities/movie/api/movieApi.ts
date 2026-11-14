import { ApiError, request, requestJson } from '@/shared/api';
import { toMovieQuery, type MovieFilters } from '../model/filters';
import type { Movie } from '../model/types';
import {
  HomeDataSchema,
  MemberLibrarySchema,
  MovieFacetsSchema,
  MoviePageSchema,
  MovieSchema,
  PlaybackSchema,
} from './schemas';

export const getHome = () => requestJson('/api/home', HomeDataSchema);

export function searchMovies(filters: MovieFilters) {
  const query = toMovieQuery(filters);
  return requestJson(query ? `/api/movies?${query}` : '/api/movies', MoviePageSchema);
}

export const getFacets = () => requestJson('/api/movie-facets', MovieFacetsSchema);

export async function getMovie(id: string): Promise<Movie | null> {
  try {
    return await requestJson(`/api/movies/${encodeURIComponent(id)}`, MovieSchema);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** 재생 권한을 확인합니다. 실패하면 상태 코드로 이유를 구분합니다. */
export const getPlayback = (id: string) =>
  requestJson(`/api/movies/${encodeURIComponent(id)}/playback`, PlaybackSchema);

const playbackUrl = (id: string, device: string) =>
  `/api/movies/${encodeURIComponent(id)}/playback?device=${encodeURIComponent(device)}`;

/** 이 기기의 재생 자리를 잡거나 갱신합니다. 동시 시청 대수를 넘으면 409입니다. */
export const claimScreen = (id: string, device: string) =>
  request(playbackUrl(id, device), { method: 'PUT' });

export const releaseScreen = (id: string, device: string) =>
  request(playbackUrl(id, device), { method: 'DELETE', keepalive: true });

export const removeProgress = (id: string) =>
  request(`/api/library/progress/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const setReleaseAlert = (id: string, saved: boolean) =>
  request(`/api/library/alert/${encodeURIComponent(id)}`, { method: saved ? 'PUT' : 'DELETE' });

export const markAlertsRead = () => request('/api/library/alerts/read', { method: 'PUT' });

export const getLibrary = () => requestJson('/api/library', MemberLibrarySchema);

export const setWatchlisted = (id: string, saved: boolean) =>
  request(`/api/library/watchlist/${encodeURIComponent(id)}`, { method: saved ? 'PUT' : 'DELETE' });

export const saveProgress = (id: string, positionSeconds: number) =>
  request(`/api/library/progress/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ positionSeconds }),
  });
