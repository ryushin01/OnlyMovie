/** TMDB의 공식 영화 장르에서 TV 영화를 뺐습니다. 이 서비스는 극장용 영화만 다룹니다. (https://developer.themoviedb.org/reference/genre-movie-list) */
export const GENRES = [
  '액션',
  '모험',
  '애니메이션',
  '코미디',
  '범죄',
  '다큐멘터리',
  '드라마',
  '가족',
  '판타지',
  '역사',
  '공포',
  '음악',
  '미스터리',
  '로맨스',
  'SF',
  '스릴러',
  '전쟁',
  '서부',
] as const;
export type Genre = (typeof GENRES)[number];

/** 영상물등급위원회의 관람 등급 */
export const AGE_RATINGS = ['all', '12', '15', '19'] as const;
export type AgeRating = (typeof AGE_RATINGS)[number];

export const AGE_LABELS: Record<AgeRating, string> = {
  all: '전체 관람가',
  '12': '12세 이상 관람가',
  '15': '15세 이상 관람가',
  '19': '청소년 관람불가',
};

export interface Movie {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  country: string;
  language: string;
  genres: Genre[];
  director: string;
  writer: string;
  cast: string[];
  runtimeMinutes: number;
  ageRating: AgeRating;
  /** 등급 분류 사유 (폭력성, 공포 등) */
  advisories: string[];
  /** 분위기 태그 */
  moods: string[];
  audioLanguages: string[];
  subtitleLanguages: string[];
  synopsis: string;
  /** 어떻게 수입했는지에 대한 이야기 */
  importNote: string;
  /** 이 서비스가 국내에 처음 들여온 작품 */
  firstImport: boolean;
  /** 서비스 공개일 (YYYY-MM-DD) */
  releasedOn: string;
  poster: string;
  backdrop: string;
}

export interface MoviePage {
  items: Movie[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MovieFacets {
  years: number[];
  countries: string[];
  directors: string[];
  actors: string[];
  ageRatings: AgeRating[];
}

export interface HomeRow {
  title: string;
  /** 전체 보기 링크의 검색 조건 */
  query: string;
  movies: Movie[];
}

export interface HomeData {
  featured: Movie | null;
  rows: HomeRow[];
}

/** 회원의 찜 목록과 보던 영화 */
export interface MemberLibrary {
  watchlist: Movie[];
  continueWatching: { movie: Movie; positionSeconds: number }[];
  /** 공개 알림을 신청한 작품. 새로 공개되어 아직 확인하지 않았으면 unread입니다. */
  alerts: ReleaseAlert[];
}

export interface ReleaseAlert {
  movie: Movie;
  unread: boolean;
}

/** 이만큼 보면 끝까지 본 것으로 보고 이어 보기에서 뺍니다. */
export const COMPLETED_RATIO = 0.95;

/** 3720 → "1:02:00" */
export function formatClock(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const rest = String(seconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${rest}`;
}

/** 공개일은 한국 날짜로 판단합니다. */
export const koreaToday = (now: Date) => now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

export const isReleased = (movie: Pick<Movie, 'releasedOn'>, now: Date) =>
  movie.releasedOn <= koreaToday(now);

/** 112 → "1시간 52분" */
export function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours && `${hours}시간`, rest && `${rest}분`].filter(Boolean).join(' ');
}

/** 2026-10-30 → "2026.10.30" */
export const formatDate = (date: string) => date.replaceAll('-', '.');
