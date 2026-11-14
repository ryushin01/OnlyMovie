import { css } from '@emotion/react';
import { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { useLibrary, useToggleWatchlist } from '@/entities/movie';
import { useSession } from '@/entities/session';
import { paths, routes } from '@/shared/config/routes';
import { AlertMessage } from '@/shared/ui/AlertMessage';
import { Button, buttonCss } from '@/shared/ui/Button';
import { onImageButtonCss } from '@/shared/ui/styles';

const errorCss = css`
  margin-top: 8px;
  font-weight: 700;
`;

/** 방문자는 로그인으로 보냅니다. 눌림 상태는 체크 표시와 `aria-pressed`로 알립니다. */
export function WatchlistButton({ movieId }: { movieId: string }) {
  const { user } = useSession();
  const { data } = useLibrary(user?.id);
  const toggle = useToggleWatchlist();
  const locked = useRef(false);
  const saved = data?.watchlist.some((movie) => movie.id === movieId) ?? false;

  if (!user) {
    return (
      <Link {...routes.login(paths.movie(movieId))} css={[buttonCss('outline'), onImageButtonCss]}>
        찜하기
      </Link>
    );
  }

  // 빠르게 두 번 누르면 isPending이 바뀌기 전에 다시 들어와 찜과 해제가 겹치므로 ref로 막습니다.
  const handleClick = () => {
    if (locked.current) return;
    locked.current = true;
    toggle.mutate(
      { id: movieId, saved: !saved },
      {
        onSettled: () => {
          locked.current = false;
        },
      },
    );
  };

  return (
    <div>
      <Button
        variant="outline"
        css={onImageButtonCss}
        aria-pressed={saved}
        pending={toggle.isPending}
        onClick={handleClick}
      >
        {saved && (
          <span aria-hidden="true" css={{ marginRight: 8 }}>
            ✓
          </span>
        )}
        찜하기
      </Button>
      <AlertMessage css={errorCss}>
        {toggle.isError ? '찜 목록을 바꾸지 못했습니다. 다시 시도해 주세요.' : null}
      </AlertMessage>
    </div>
  );
}
