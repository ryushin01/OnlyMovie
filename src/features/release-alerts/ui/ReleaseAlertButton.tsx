import { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { useLibrary, useToggleReleaseAlert } from '@/entities/movie';
import { useSession } from '@/entities/session';
import { paths, routes } from '@/shared/config/routes';
import { AlertMessage } from '@/shared/ui/AlertMessage';
import { Button, buttonCss } from '@/shared/ui/Button';
import { onImageButtonCss } from '@/shared/ui/styles';

interface Props {
  movieId: string;
  /** 어두운 이미지 위에 놓을 때 */
  onImage?: boolean;
}

/** 공개 예정작의 공개 알림을 신청합니다. 방문자는 로그인으로 보내고, 눌림 상태는 체크 표시와 `aria-pressed`로 알립니다. */
export function ReleaseAlertButton({ movieId, onImage = false }: Props) {
  const { user } = useSession();
  const { data } = useLibrary(user?.id);
  const toggle = useToggleReleaseAlert();
  const locked = useRef(false);
  const saved = data?.alerts.some((alert) => alert.movie.id === movieId) ?? false;
  const imageCss = onImage ? onImageButtonCss : undefined;

  if (!user) {
    return (
      <Link {...routes.login(paths.movie(movieId))} css={[buttonCss('outline'), imageCss]}>
        공개 알림 받기
      </Link>
    );
  }

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
        css={imageCss}
        aria-pressed={saved}
        pending={toggle.isPending}
        onClick={handleClick}
      >
        {saved && (
          <span aria-hidden="true" css={{ marginRight: 8 }}>
            ✓
          </span>
        )}
        공개 알림 받기
      </Button>
      <AlertMessage css={{ marginTop: 8, fontWeight: 700 }}>
        {toggle.isError ? '공개 알림을 바꾸지 못했습니다. 다시 시도해 주세요.' : null}
      </AlertMessage>
    </div>
  );
}
