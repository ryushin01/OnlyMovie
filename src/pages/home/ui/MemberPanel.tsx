import { css } from '@emotion/react';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { formatDate, isReleased, useLibrary, type Movie } from '@/entities/movie';
import { useSession } from '@/entities/session';
import { activePlan, PeriodMeter, planSurfaceCss, PLANS, useSubscription } from '@/entities/subscription';
import { routes } from '@/shared/config';
import { buttonCss } from '@/shared/ui/Button';
import { panelCss, sectionTitleCss } from '@/shared/ui/styles';

/** 넓은 화면에서만 본문 옆에 놓습니다. 같은 정보는 내 계정과 메인의 줄에서도 볼 수 있습니다. */
const asideCss = css`
  @media (max-width: 1439.98px) {
    display: none;
  }
  @media (min-width: 1440px) {
    position: sticky;
    top: 16px;
    display: grid;
    gap: 16px;
    padding-top: 60px;
  }
`;
const blockCss = css`
  ${panelCss}
  padding: 20px;

  h2 {
    margin: 0 0 12px;
  }
  p {
    margin: 0;
  }
`;
const headingCss = css`
  ${sectionTitleCss}
  font-size: 1rem;
`;
const planNameCss = css`
  font-size: 1.125rem;
  font-weight: 800;
`;
const actionCss = css`
  width: 100%;
  margin-top: 14px;
`;
const thumbsCss = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;

  a {
    display: block;
    overflow: hidden;
    border-radius: 8px;
  }
  img {
    display: block;
    width: 100%;
    aspect-ratio: 2 / 3;
    object-fit: cover;
  }
`;
const alertListCss = css`
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;

  a {
    display: inline-block;
    min-height: 24px;
    color: var(--ink);
    font-weight: 700;
  }
  small {
    display: block;
    color: var(--muted);
    font-size: 0.8125rem;
  }
`;

function Favorites({ movies }: { movies: Movie[] }) {
  return (
    <section css={blockCss} aria-labelledby="panel-favorites">
      <h2 id="panel-favorites" css={headingCss}>
        찜 바로가기
      </h2>
      <ul css={thumbsCss}>
        {movies.slice(0, 6).map((movie) => (
          <li key={movie.id}>
            <Link {...routes.movie(movie.id)}>
              <img src={movie.poster} alt={movie.title} loading="lazy" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 시안의 내 정보 영역. 이용권 상태와 찜, 다가오는 공개 알림을 한눈에 보여 줍니다. */
export function MemberPanel() {
  const { user, isPending } = useSession();
  const { data: subscription } = useSubscription(user?.id);
  const { data: library } = useLibrary(user?.id);
  const plan = activePlan(subscription?.subscription);
  const [now] = useState(() => new Date());
  const upcoming = library?.alerts.filter((alert) => !isReleased(alert.movie, now)).slice(0, 3) ?? [];

  return (
    <aside css={asideCss} aria-label="내 정보">
      {isPending ? null : !user ? (
        <section css={blockCss}>
          <h2 css={headingCss}>아직 수입되지 않은 영화를 먼저</h2>
          <p>가입하고 이용권을 고르면 국내 첫 공개작을 가장 먼저 볼 수 있습니다.</p>
          <Link {...routes.plans} css={[buttonCss(), actionCss]}>
            이용권 둘러보기
          </Link>
        </section>
      ) : (
        <>
          {plan && subscription?.subscription ? (
            <section css={[blockCss, planSurfaceCss(plan)]}>
              <p css={planNameCss}>{PLANS[plan].name} 이용 중</p>
              <PeriodMeter
                end={subscription.subscription.currentPeriodEnd}
                label={subscription.subscription.cancelAtPeriodEnd ? '해지' : '다음 결제'}
              />
              <Link {...routes.account} css={[buttonCss('outline'), actionCss]}>
                이용권 관리
              </Link>
            </section>
          ) : (
            <section css={blockCss}>
              <p css={planNameCss}>이용 중인 이용권이 없습니다</p>
              <Link {...routes.plans} css={[buttonCss(), actionCss]}>
                이용권 둘러보기
              </Link>
            </section>
          )}
          {library && library.watchlist.length > 0 && <Favorites movies={library.watchlist} />}
          {upcoming.length > 0 && (
            <section css={blockCss} aria-labelledby="panel-upcoming">
              <h2 id="panel-upcoming" css={headingCss}>
                다가오는 공개
              </h2>
              <ul css={alertListCss}>
                {upcoming.map(({ movie }) => (
                  <li key={movie.id}>
                    <Link {...routes.movie(movie.id)}>{movie.title}</Link>
                    <small>{formatDate(movie.releasedOn)} 공개</small>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </aside>
  );
}
