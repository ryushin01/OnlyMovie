import { remainingNotes, watchedRatios, type MemberLibrary } from '@/entities/movie';
import { RemoveProgressButton } from '@/features/remove-progress';
import { MovieRow } from './MovieRow';

/**
 * 이어 볼 영화 줄. 남은 시간과 본 비율을 함께 보여 주고, 카드마다 기록 지우기 버튼을 둡니다.
 * 홈(이어 보기)과 내 계정(시청 기록)이 함께 씁니다. 볼 영화가 없으면 그리지 않습니다.
 */
export function ContinueWatchingRow({
  library,
  title,
}: {
  library: MemberLibrary | undefined;
  title: string;
}) {
  if (!library || library.continueWatching.length === 0) return null;
  return (
    <MovieRow
      title={title}
      movies={library.continueWatching.map((item) => item.movie)}
      notes={remainingNotes(library)}
      progress={watchedRatios(library)}
      cardAction={(movie) => <RemoveProgressButton movieId={movie.id} title={movie.title} />}
      wide
    />
  );
}
