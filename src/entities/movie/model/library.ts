import { formatRuntime, type MemberLibrary } from './types';

/** 작품별 남은 시간 글자 */
export const remainingNotes = ({ continueWatching }: MemberLibrary) =>
  Object.fromEntries(
    continueWatching.map(({ movie, positionSeconds }) => [
      movie.id,
      `${formatRuntime(Math.max(1, Math.ceil(movie.runtimeMinutes - positionSeconds / 60)))} 남음`,
    ]),
  );

/** 작품별 본 비율 (0~1) */
export const watchedRatios = ({ continueWatching }: MemberLibrary) =>
  Object.fromEntries(
    continueWatching.map(({ movie, positionSeconds }) => [
      movie.id,
      positionSeconds / (movie.runtimeMinutes * 60),
    ]),
  );
