import { css } from '@emotion/react';
import { GENRES, GenreLinks, remainingNotes, useHome, useLibrary, watchedRatios } from '@/entities/movie';
import { useSession } from '@/entities/session';
import { RemoveProgressButton } from '@/features/remove-progress';
import { routes } from '@/shared/config/routes';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';
import { PageMessage } from '@/shared/ui/PageMessage';
import { MemberPanel } from '@/widgets/member-panel';
import { MovieRow } from '@/widgets/movie-row';
import { FeaturedMovie } from './FeaturedMovie';
import { LoadFailed } from '@/shared/ui/LoadFailed';
import { HomeSkeleton } from './HomeSkeleton';

const layoutCss = css`
  @media (min-width: 1440px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    align-items: start;
    gap: 24px;
  }
`;
const columnCss = css`
  /* 옆에 내 정보가 놓이면 작품 줄이 화면 끝까지 번지지 않게 합니다. 초점 표시가 잘리지 않을 만큼만 남깁니다. */
  @media (min-width: 1440px) {
    --gutter: 4px;
  }
`;

/** 3단 구조의 첫 단계: 메인 → 리스트 → 디테일 */
export function HomePage() {
  useDocumentTitle();
  const { data, isPending, isError } = useHome();
  const { user } = useSession();
  const { data: library } = useLibrary(user?.id);

  if (isPending) return <HomeSkeleton />;
  if (isError) {
    return <LoadFailed title="영화를 불러오지 못했습니다" />;
  }
  if (!data.featured) return <PageMessage title="아직 공개된 영화가 없습니다" />;

  return (
    <div css={layoutCss}>
      <div css={columnCss}>
        <FeaturedMovie movie={data.featured} />
        <nav aria-label="장르별 영화" css={{ marginTop: 24 }}>
          <GenreLinks genres={GENRES} />
        </nav>
        {library && library.continueWatching.length > 0 && (
          <MovieRow
            title="이어 보기"
            movies={library.continueWatching.map((item) => item.movie)}
            notes={remainingNotes(library)}
            progress={watchedRatios(library)}
            cardAction={(movie) => <RemoveProgressButton movieId={movie.id} title={movie.title} />}
            wide
          />
        )}
        {library && library.watchlist.length > 0 && (
          <MovieRow title="찜한 영화" movies={library.watchlist} wide />
        )}
        {data.rows.map((row) => (
          <MovieRow
            key={row.title}
            title={row.title}
            movies={row.movies}
            moreTo={routes.movies(Object.fromEntries(new URLSearchParams(row.query)))}
            wide
          />
        ))}
      </div>
      <MemberPanel />
    </div>
  );
}
