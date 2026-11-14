import { css } from '@emotion/react';
import { useState } from 'react';
import { Link, Navigate } from '@tanstack/react-router';
import { useLibrary } from '@/entities/movie';
import { RequireAuth, useSession, type SessionUser } from '@/entities/session';
import {
  activePlan,
  formatPrice,
  PeriodMeter,
  planSurfaceCss,
  PLANS,
  useSubscription,
  type Payment,
} from '@/entities/subscription';
import { routes } from '@/shared/config';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';
import { AlertMessage } from '@/shared/ui/AlertMessage';
import { buttonCss } from '@/shared/ui/Button';
import { pageTitleCss, panelCss, sectionTitleCss } from '@/shared/ui/styles';
import { formatKoreanDate } from '@/shared/lib/date';
import { ContinueWatchingRow, MovieRow } from '@/widgets/movie-row';
import { DeleteAccountButton } from './DeleteAccountButton';
import { SubscriptionManager } from './SubscriptionManager';

const sectionCss = css`
  ${panelCss}
  max-width: 60rem;
  margin-top: 24px;
  box-shadow: var(--shadow);

  h2 {
    margin: 0 0 8px;
    font-size: 1.25rem;
    font-weight: 700;
  }
`;
const scrollCss = css`
  overflow-x: auto;
`;
const tableCss = css`
  width: 100%;
  border-collapse: collapse;

  caption {
    ${sectionTitleCss}
    margin-bottom: 8px;
  }
  th,
  td {
    padding: 8px 12px 8px 0;
    border-bottom: 1px solid var(--field-line);
    text-align: left;
    white-space: nowrap;
  }
`;

const KIND = { new: '신규', renewal: '정기 결제', upgrade: '이용권 올림' };
const STATUS = { paid: '성공', failed: '실패' };

const day = (iso: string) => formatKoreanDate(iso, 'medium');

function Payments({ payments }: { payments: Payment[] }) {
  return (
    <div css={sectionCss}>
      {/* 좁은 화면에서 옆으로 밀어 보는 영역이므로 키보드로도 스크롤할 수 있게 합니다. */}
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <section css={scrollCss} aria-labelledby="payments-title" tabIndex={0}>
        <table css={tableCss}>
          <caption id="payments-title">가상 결제 내역</caption>
          <thead>
            <tr>
              <th scope="col">날짜</th>
              <th scope="col">이용권</th>
              <th scope="col">구분</th>
              <th scope="col">금액</th>
              <th scope="col">결과</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{day(payment.createdAt)}</td>
                <td>{PLANS[payment.plan].name}</td>
                <td>{KIND[payment.kind]}</td>
                <td>{formatPrice(payment.amount)}</td>
                <td>{STATUS[payment.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Account({ user, onDeleted }: { user: SessionUser; onDeleted: () => void }) {
  const { data, isPending, isError } = useSubscription(user.id);
  const plan = activePlan(data?.subscription);
  const { data: library } = useLibrary(user.id);

  return (
    <>
      <h1 css={pageTitleCss}>내 계정</h1>
      <p css={{ margin: 0 }}>
        {user.name ? `${user.name} · ` : ''}
        {user.email}
      </p>
      {isPending && <output css={{ display: 'block', marginTop: 32 }}>이용권을 확인하는 중입니다.</output>}
      <AlertMessage css={{ marginTop: 32 }}>
        {isError ? '이용권을 불러오지 못했습니다. 새로고침해 주세요.' : null}
      </AlertMessage>
      {data && (
        <>
          <section css={[sectionCss, plan && planSurfaceCss(plan)]}>
            <h2>{plan ? `${PLANS[plan].name} 이용권 이용 중` : '이용 중인 이용권이 없습니다'}</h2>
            {plan && data.subscription ? (
              <>
                <PeriodMeter
                  end={data.subscription.currentPeriodEnd}
                  label={data.subscription.cancelAtPeriodEnd ? '해지' : '다음 결제'}
                />
                <SubscriptionManager subscription={data.subscription} />
              </>
            ) : (
              <Link {...routes.plans} css={[buttonCss(), { marginTop: 12 }]}>
                이용권 보기
              </Link>
            )}
          </section>
          {data.payments.length > 0 && <Payments payments={data.payments} />}
        </>
      )}
      <ContinueWatchingRow library={library} title="시청 기록" />
      {library && library.watchlist.length > 0 && <MovieRow title="찜한 영화" movies={library.watchlist} />}
      <section css={sectionCss}>
        <h2>회원 탈퇴</h2>
        <p css={{ margin: '0 0 12px' }}>계정과 이용권, 결제 내역, 찜 목록, 이어 보기 기록을 모두 지웁니다.</p>
        <DeleteAccountButton onDone={onDeleted} />
      </section>
    </>
  );
}

export function AccountPage() {
  useDocumentTitle('내 계정');
  const { user } = useSession();
  // 세션이 비기 전에 세우므로, 탈퇴한 사람이 로그인 화면으로 가는 순간이 생기지 않습니다.
  const [deleted, setDeleted] = useState(false);
  if (deleted) return <Navigate {...routes.home} replace />;
  return <RequireAuth>{user && <Account user={user} onDeleted={() => setDeleted(true)} />}</RequireAuth>;
}
