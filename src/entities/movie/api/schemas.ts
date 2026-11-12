import { z } from 'zod/mini';
import {
  AGE_RATINGS,
  GENRES,
  type HomeData,
  type MemberLibrary,
  type Movie,
  type MovieFacets,
  type MoviePage,
} from '../model/types';

// 서버(netlify/)와 함께 쓰는 타입은 model/types.ts에 두고, 화면은 받은 응답을 여기 스키마로 확인합니다.
// 스키마에 타입을 붙여 두어 두 정의가 어긋나면 타입 검사에서 드러납니다.

const strings = z.array(z.string());

export const MovieSchema: z.ZodMiniType<Movie> = z.object({
  id: z.string(),
  title: z.string(),
  originalTitle: z.string(),
  year: z.number(),
  country: z.string(),
  language: z.string(),
  genres: z.array(z.enum(GENRES)),
  director: z.string(),
  writer: z.string(),
  cast: strings,
  runtimeMinutes: z.number(),
  ageRating: z.enum(AGE_RATINGS),
  advisories: strings,
  moods: strings,
  audioLanguages: strings,
  subtitleLanguages: strings,
  synopsis: z.string(),
  importNote: z.string(),
  firstImport: z.boolean(),
  releasedOn: z.string(),
  poster: z.string(),
  backdrop: z.string(),
});

export const MoviePageSchema: z.ZodMiniType<MoviePage> = z.object({
  items: z.array(MovieSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const MovieFacetsSchema: z.ZodMiniType<MovieFacets> = z.object({
  years: z.array(z.number()),
  countries: strings,
  directors: strings,
  actors: strings,
  ageRatings: z.array(z.enum(AGE_RATINGS)),
});

export const HomeDataSchema: z.ZodMiniType<HomeData> = z.object({
  featured: z.nullable(MovieSchema),
  rows: z.array(z.object({ title: z.string(), query: z.string(), movies: z.array(MovieSchema) })),
});

export const MemberLibrarySchema: z.ZodMiniType<MemberLibrary> = z.object({
  watchlist: z.array(MovieSchema),
  continueWatching: z.array(z.object({ movie: MovieSchema, positionSeconds: z.number() })),
  alerts: z.array(z.object({ movie: MovieSchema, unread: z.boolean() })),
});

export const PlaybackSchema = z.object({ quality: z.string(), positionSeconds: z.number() });
