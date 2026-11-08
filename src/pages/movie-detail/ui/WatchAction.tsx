import { css } from '@emotion/react';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { formatClock, formatDate, isReleased, useLibrary, type Movie } from '@/entities/movie';
import { useSession } from '@/entities/session';
import { activePlan, useSubscription, watchBlock } from '@/entities/subscription';
import { paths, routes } from '@/shared/config/routes';
import { buttonCss } from '@/shared/ui/Button';

const noteCss = css`
  margin: 8px 0 0;
  font-size: 0.9375rem;
`;

/** 로그인과 이용권 상태에 맞는 다음 행동을 안내합니다. 실제 재생 권한은 서버가 다시 확인합니다. */
export function WatchAction({ movie }: { movie: Movie }) {
  const { user, isPending } = useSession();
  const { data, isPending: loadingPlan } = useSubscription(user?.id);
  const { data: library } = useLibrary(user?.id);
  const [now] = useState(() => new Date());
  const released = isReleased(movie, now);

  if (!released) return <p css={{ margin: 0, fontWeight: 700 }}>{formatDate(movie.releasedOn)} 공개 예정</p>;
  if (isPending || (user && loadingPlan)) return <output>이용권을 확인하는 중입니다.</output>;

  const block = watchBlock(
    { firstImport: movie.firstImport, released },
    { loggedIn: Boolean(user), plan: activePlan(data?.subscription) },
  );

  if (block === 'login_required') {
    return (
      <Link {...routes.login(paths.movie(movie.id))} css={buttonCss()}>
        로그인하고 보기
      </Link>
    );
  }
  if (block === 'plan_required') {
    return (
      <Link {...routes.plans} css={buttonCss()}>
        이용권 구매하고 보기
      </Link>
    );
  }
  if (block === 'upgrade_required') {
    return (
      <>
        <Link {...routes.account} css={buttonCss()}>
          이용권 올리고 보기
        </Link>
        <p css={noteCss}>국내 첫 공개작은 스탠다드 이상 이용권으로 볼 수 있습니다.</p>
      </>
    );
  }
  const watching = library?.continueWatching.find((item) => item.movie.id === movie.id);
  return (
    <Link {...routes.watch(movie.id)} css={buttonCss()}>
      {watching ? `이어 보기 (${formatClock(watching.positionSeconds)}부터)` : '재생'}
    </Link>
  );
}
