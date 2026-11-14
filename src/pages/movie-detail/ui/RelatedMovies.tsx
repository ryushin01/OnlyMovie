import { useMovies, type Movie } from '@/entities/movie';
import { routes } from '@/shared/config';
import { MovieRow, MovieRowSkeleton } from '@/widgets/movie-row';

/** 첫 번째 장르가 같은 공개작입니다. 없으면 줄을 그리지 않습니다. */
export function RelatedMovies({ movie }: { movie: Movie }) {
  const genre = movie.genres[0];
  const { data, isPending } = useMovies({ genre, status: 'now' });
  if (isPending) return <MovieRowSkeleton title="비슷한 영화" />;
  const movies = data?.items.filter((item) => item.id !== movie.id) ?? [];
  if (movies.length === 0) return null;
  return <MovieRow title="비슷한 영화" movies={movies} moreTo={routes.movies({ genre, status: 'now' })} />;
}
