import { useMovies, type Movie } from '@/entities/movie';
import { routes } from '@/shared/config/routes';
import { MovieRow } from '@/widgets/movie-row';

/** 검색 결과 아래에 첫 결과와 장르가 같은 작품, 추천작을 잇습니다. 이미 위에 나온 작품은 빼고 줄끼리도 겹치지 않게 합니다. */
export function SearchExtras({ results }: { results: Movie[] }) {
  const genre = results[0].genres[0];
  const related = useMovies({ genre, status: 'now' });
  const picks = useMovies({ firstImport: true, status: 'now' });

  const shown = new Set(results.map((movie) => movie.id));
  const relatedMovies = related.data?.items.filter((movie) => !shown.has(movie.id)) ?? [];
  relatedMovies.forEach((movie) => shown.add(movie.id));
  const pickMovies = picks.data?.items.filter((movie) => !shown.has(movie.id)) ?? [];

  return (
    <>
      {relatedMovies.length > 0 && (
        <MovieRow
          title="연관 영화"
          movies={relatedMovies}
          moreTo={routes.movies({ genre, status: 'now' })}
          wide
        />
      )}
      {pickMovies.length > 0 && (
        <MovieRow
          title="추천 영화"
          movies={pickMovies}
          moreTo={routes.movies({ firstImport: 'true', status: 'now' })}
          wide
        />
      )}
    </>
  );
}
