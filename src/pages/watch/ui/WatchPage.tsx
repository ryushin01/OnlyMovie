import { css } from '@emotion/react';
import { Link, Navigate, getRouteApi } from '@tanstack/react-router';
import { useMovie, usePlayback } from '@/entities/movie';
import { ApiError } from '@/shared/api';
import { paths, routes } from '@/shared/config';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';
import { buttonCss } from '@/shared/ui/Button';
import { PageMessage } from '@/shared/ui/PageMessage';
import { formTitleCss } from '@/shared/ui/styles';
import { LoadFailed } from '@/shared/ui/LoadFailed';
import { Player } from './Player';

const route = getRouteApi('/watch/$id');

const titleCss = css`
  ${formTitleCss}
  padding-block: 8px 16px;
`;

export function WatchPage() {
  const { id } = route.useParams();
  const movie = useMovie(id);
  const playback = usePlayback(id);
  const title = movie.data?.title;
  useDocumentTitle(title ? `${title} 재생` : '재생');

  if (playback.isPending || movie.isPending) {
    return <output css={{ display: 'block', paddingTop: 32 }}>재생 권한을 확인하는 중입니다.</output>;
  }

  const status = playback.error instanceof ApiError ? playback.error.status : 0;
  if (status === 401) return <Navigate {...routes.login(paths.watch(id))} replace />;
  if (status === 403) {
    return (
      <PageMessage title="이용권이 필요합니다">
        <p css={{ margin: '0 0 24px' }}>국내 첫 공개작은 스탠다드 이상 이용권으로 볼 수 있습니다.</p>
        <Link {...routes.plans} css={buttonCss()}>
          이용권 보기
        </Link>
      </PageMessage>
    );
  }
  if (status === 409) {
    return (
      <PageMessage title="아직 공개되지 않은 영화입니다">
        <Link {...routes.movie(id)} css={buttonCss()}>
          작품 정보 보기
        </Link>
      </PageMessage>
    );
  }
  if (status === 404 || (movie.isSuccess && !movie.data)) {
    return (
      <PageMessage title="영화를 찾을 수 없습니다">
        <Link {...routes.movies()} css={buttonCss()}>
          영화 찾기로
        </Link>
      </PageMessage>
    );
  }
  if (playback.isError || movie.isError || !movie.data || !playback.data) {
    return <LoadFailed title="재생 정보를 불러오지 못했습니다" />;
  }

  return (
    <>
      <h1 css={titleCss}>{movie.data.title}</h1>
      <Player movie={movie.data} quality={playback.data.quality} startAt={playback.data.positionSeconds} />
    </>
  );
}
