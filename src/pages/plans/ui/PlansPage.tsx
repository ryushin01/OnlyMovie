import { css } from '@emotion/react';
import { Link } from '@tanstack/react-router';
import { useSession } from '@/entities/session';
import {
  activePlan,
  formatPrice,
  PLAN_IDS,
  planSurfaceCss,
  PLANS,
  useSubscription,
} from '@/entities/subscription';
import { routes } from '@/shared/config/routes';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';
import { buttonCss } from '@/shared/ui/Button';
import { pageTitleCss } from '@/shared/ui/styles';

const gridCss = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
  gap: 16px;
  margin: 32px 0 0;
  padding: 0;
  list-style: none;
`;
const cardCss = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 28px;
  border-radius: var(--radius);
  box-shadow: var(--shadow);

  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
  }
  ul {
    flex: 1;
    margin: 16px 0 24px;
    padding-left: 20px;
  }
`;
const priceCss = css`
  margin: 8px 0 0;
  font-size: 1.75rem;
  font-weight: 800;
`;

export function PlansPage() {
  useDocumentTitle('이용권');
  const { user } = useSession();
  const { data } = useSubscription(user?.id);
  const current = activePlan(data?.subscription);

  return (
    <>
      <h1 css={pageTitleCss}>이용권</h1>
      <p css={{ margin: 0, maxWidth: '44rem' }}>
        시네필이 기다려 온 미수입 영화를 가장 먼저 만나 보세요. 포트폴리오 프로젝트로, 실제 결제는 이루어지지
        않습니다.
      </p>
      <ul css={gridCss}>
        {PLAN_IDS.map((id) => {
          const plan = PLANS[id];
          return (
            <li key={id}>
              <article css={[cardCss, planSurfaceCss(id)]}>
                <h2>{plan.name}</h2>
                <p css={priceCss}>월 {formatPrice(plan.price)}</p>
                <ul>
                  <li>최대 {plan.quality} 화질</li>
                  <li>동시 시청 {plan.screens}대</li>
                  <li>{plan.firstImports ? '국내 첫 공개작 포함 전체 영화' : '국내 첫 공개작을 뺀 영화'}</li>
                </ul>
                {current === id ? (
                  <Link {...routes.account} css={buttonCss('outline')}>
                    <span>이용 중인 {plan.name} 관리</span>
                  </Link>
                ) : current ? (
                  <Link {...routes.account} css={buttonCss('outline')}>
                    {plan.name}(으)로 변경
                  </Link>
                ) : (
                  <Link {...routes.checkout(id)} css={buttonCss()}>
                    {plan.name} 시작하기
                  </Link>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </>
  );
}
