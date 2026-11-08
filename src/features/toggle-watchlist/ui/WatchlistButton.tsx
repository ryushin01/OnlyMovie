import { css } from '@emotion/react';
import { Link } from '@tanstack/react-router';
import { useLibrary, useToggleWatchlist } from '@/entities/movie';
import { useSession } from '@/entities/session';
import { paths, routes } from '@/shared/config/routes';
import { Button, buttonCss } from '@/shared/ui/Button';
import { onImageButtonCss } from '@/shared/ui/styles';

const errorCss = css`
  margin: 8px 0 0;
  font-weight: 700;
`;

/** 방문자는 로그인으로 보냅니다. 눌림 상태는 체크 표시와 `aria-pressed`로 알립니다. */
export function WatchlistButton({ movieId }: { movieId: string }) {
  const { user } = useSession();
  const { data } = useLibrary(user?.id);
  const toggle = useToggleWatchlist();
  const saved = data?.watchlist.some((movie) => movie.id === movieId) ?? false;

  if (!user) {
    return (
      <Link {...routes.login(paths.movie(movieId))} css={[buttonCss('outline'), onImageButtonCss]}>
        찜하기
      </Link>
    );
  }

  return (
    <div>
      <Button
        variant="outline"
        css={onImageButtonCss}
        aria-pressed={saved}
        disabled={toggle.isPending}
        onClick={() => toggle.mutate({ id: movieId, saved: !saved })}
      >
        {saved && (
          <span aria-hidden="true" css={{ marginRight: 8 }}>
            ✓
          </span>
        )}
        찜하기
      </Button>
      {toggle.isError && (
        <p role="alert" css={errorCss}>
          찜 목록을 바꾸지 못했습니다. 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
}
