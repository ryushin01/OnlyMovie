import { css } from '@emotion/react';
import { useEffect, useRef } from 'react';
import {
  formatPrice,
  isUpgrade,
  PLAN_IDS,
  PLANS,
  useChangeSubscription,
  type PlanId,
  type Subscription,
  type SubscriptionChange,
} from '@/entities/subscription';
import { formatKoreanDate } from '@/shared/lib/date';
import { Button } from '@/shared/ui/Button';

const actionsCss = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`;
const alertCss = css`
  margin: 16px 0 0;
  color: var(--danger);
  font-weight: 700;
`;

const formatDay = (iso: string) => formatKoreanDate(iso, 'long');

const changeLabel = (current: PlanId, target: PlanId) => {
  const { name, price } = PLANS[target];
  if (!isUpgrade(current, target)) return `${name}(으)로 낮추기`;
  return `${name}(으)로 올리기 (차액 ${formatPrice(price - PLANS[current].price)} 가상 결제)`;
};

/** 이용 중인 이용권을 바꾸거나 해지합니다. 만료된 이용권은 다루지 않습니다. */
export function SubscriptionManager({ subscription }: { subscription: Subscription }) {
  const change = useChangeSubscription();
  const submitting = useRef(false);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const { plan, pendingPlan, cancelAtPeriodEnd, currentPeriodEnd } = subscription;
  const end = formatDay(currentPeriodEnd);

  useEffect(() => {
    if (change.isError) alertRef.current?.focus();
  }, [change.isError]);

  // 빠르게 두 번 누르면 isPending이 바뀌기 전에 다시 들어오므로 ref로 막습니다.
  const submit = (data: SubscriptionChange) => {
    if (submitting.current) return;
    submitting.current = true;
    change.mutate(data, {
      onSettled: () => {
        submitting.current = false;
      },
    });
  };

  const cancel = () => {
    if (window.confirm(`${end}까지 이용한 뒤 해지됩니다. 해지할까요?`)) submit({ action: 'cancel' });
  };

  return (
    <>
      <p css={{ margin: '12px 0 0' }}>
        {cancelAtPeriodEnd
          ? `${end}에 해지됩니다. 그때까지 계속 볼 수 있습니다.`
          : `다음 결제일은 ${end}입니다.`}
      </p>
      {pendingPlan && (
        <p css={{ margin: '4px 0 0' }}>다음 결제일부터 {PLANS[pendingPlan].name} 이용권으로 바뀝니다.</p>
      )}
      <div css={actionsCss}>
        {cancelAtPeriodEnd ? (
          <Button disabled={change.isPending} onClick={() => submit({ action: 'resume' })}>
            해지 취소
          </Button>
        ) : (
          <>
            {PLAN_IDS.filter((id) => id !== plan && id !== pendingPlan).map((id) => (
              <Button
                key={id}
                variant="outline"
                disabled={change.isPending}
                onClick={() => submit({ action: 'change', plan: id })}
              >
                {changeLabel(plan, id)}
              </Button>
            ))}
            {pendingPlan && (
              <Button
                variant="outline"
                disabled={change.isPending}
                onClick={() => submit({ action: 'change', plan })}
              >
                변경 예약 취소
              </Button>
            )}
            <Button variant="outline" disabled={change.isPending} onClick={cancel}>
              해지하기
            </Button>
          </>
        )}
      </div>
      {change.isError && (
        <p ref={alertRef} role="alert" tabIndex={-1} css={alertCss}>
          요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.
        </p>
      )}
    </>
  );
}
