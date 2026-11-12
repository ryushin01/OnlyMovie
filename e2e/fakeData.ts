import { MOVIES } from '../scripts/seed-movies.mjs';

// E2E(fakeApi.ts)와 Lighthouse용 서버(scripts/lighthouse-server.ts)가 함께 쓰는 목업 데이터와 읽기 응답입니다.

/** 공개 예정작이 늘 같게 보이도록 날짜를 고정합니다. */
export const TODAY = '2026-11-06';
export const NOW = new Date(`${TODAY}T12:00:00+09:00`);
export const PAGE_SIZE = 24;

export interface FakeMovie {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  country: string;
  language: string;
  genres: string[];
  director: string;
  writer: string;
  cast: string[];
  runtimeMinutes: number;
  ageRating: string;
  advisories: string[];
  moods: string[];
  audioLanguages: string[];
  subtitleLanguages: string[];
  synopsis: string;
  importNote: string;
  firstImport: boolean;
  releasedOn: string;
  poster: string;
  backdrop: string;
}

export const seedMovies = (): FakeMovie[] =>
  MOVIES.map((row) => {
    const [
      id,
      title,
      originalTitle,
      year,
      country,
      language,
      genres,
      director,
      writer,
      cast,
      runtimeMinutes,
      ageRating,
      advisories,
      moods,
      ,
      ,
      releasedOn,
      firstImport,
      synopsis,
      importNote,
    ] = row as [
      string,
      string,
      string,
      number,
      string,
      string,
      string[],
      string,
      string,
      string[],
      number,
      string,
      string[],
      string[],
      string,
      string,
      string,
      boolean,
      string,
      string,
    ];
    return {
      id,
      title,
      originalTitle,
      year,
      country,
      language,
      genres,
      director,
      writer,
      cast,
      runtimeMinutes,
      ageRating,
      advisories,
      moods,
      audioLanguages: genres.includes('가족') ? [language, '한국어'] : [language],
      subtitleLanguages: ['한국어', '영어'],
      synopsis,
      importNote,
      firstImport,
      releasedOn,
      poster: `/seed/${id}-poster.svg`,
      backdrop: `/seed/${id}-backdrop.svg`,
    };
  });

export function search(movies: FakeMovie[], params: URLSearchParams, pageSize = PAGE_SIZE) {
  const get = (key: string) => params.get(key);
  const has = (text: string, term: string) => text.toLowerCase().includes(term.toLowerCase());
  const q = get('q');
  const released = (movie: FakeMovie) => movie.releasedOn <= TODAY;
  const matched = movies.filter(
    (movie) =>
      (!q ||
        [movie.title, movie.originalTitle, movie.director, movie.writer, movie.country, ...movie.cast].some(
          (text) => has(text, q),
        )) &&
      (!get('genre') || movie.genres.includes(get('genre')!)) &&
      (!get('year') || movie.year === Number(get('year'))) &&
      (!get('country') || movie.country === get('country')) &&
      (!get('director') || has(movie.director, get('director')!)) &&
      (!get('actor') || movie.cast.some((actor) => has(actor, get('actor')!))) &&
      (!get('age') || movie.ageRating === get('age')) &&
      (get('runtime') !== 'short' || movie.runtimeMinutes <= 90) &&
      (get('runtime') !== 'medium' || (movie.runtimeMinutes > 90 && movie.runtimeMinutes <= 120)) &&
      (get('runtime') !== 'long' || movie.runtimeMinutes > 120) &&
      (get('status') !== 'now' || released(movie)) &&
      (get('status') !== 'upcoming' || !released(movie)) &&
      (get('firstImport') !== 'true' || movie.firstImport),
  );
  const sort = get('sort');
  matched.sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title, 'ko');
    if (sort === 'year') return b.year - a.year;
    if (sort === 'runtime') return a.runtimeMinutes - b.runtimeMinutes;
    if (get('status') === 'upcoming') return a.releasedOn.localeCompare(b.releasedOn);
    return Number(!released(a)) - Number(!released(b)) || b.releasedOn.localeCompare(a.releasedOn);
  });
  const page = Number(get('page')) || 1;
  return {
    items: matched.slice((page - 1) * pageSize, page * pageSize),
    total: matched.length,
    page,
    pageSize,
  };
}

/** 검색 조건에 쓰는 고르기 목록 (/api/movie-facets) */
export const facets = (movies: FakeMovie[]) => ({
  years: [...new Set(movies.map((movie) => movie.year))].sort((a, b) => b - a),
  countries: [...new Set(movies.map((movie) => movie.country))].sort(),
  directors: [...new Set(movies.map((movie) => movie.director))].sort(),
  actors: [...new Set(movies.flatMap((movie) => movie.cast))].sort(),
  ageRatings: ['all', '12', '15'],
});

/** 첫 화면의 줄들 (/api/home) */
export function home(movies: FakeMovie[]) {
  const row = (title: string, query: string) => ({
    title,
    query,
    movies: search(movies, new URLSearchParams(query), 16).items,
  });
  const rows = [
    row('국내 첫 공개', 'firstImport=true&status=now'),
    row('공개 예정', 'status=upcoming'),
    row('최근 공개', 'status=now'),
    row('드라마', 'genre=드라마&status=now'),
    row('스릴러', 'genre=스릴러&status=now'),
    row('SF', 'genre=SF&status=now'),
    row('가족', 'genre=가족&status=now'),
  ].filter((item) => item.movies.length > 0);
  return { featured: rows[0]?.movies[0] ?? null, rows };
}
