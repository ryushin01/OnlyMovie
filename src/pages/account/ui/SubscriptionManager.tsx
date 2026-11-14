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
import { AlertMessage } from '@/shared/ui/AlertMessage';
import { Button } from '@/shared/ui/Button';

const statusCss = css`
  display: block;
  margin-top: 12px;

  span {
    display: block;
  }
  span + span {
    margin-top: 4px;
  }
`;
const actionsCss = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`;
const alertCss = css`
  margin-top: 16px;
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
  const restoreFocus = useRef(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const { plan, pendingPlan, cancelAtPeriodEnd, currentPeriodEnd } = subscription;
  const end = formatDay(currentPeriodEnd);

  // 바뀐 상태에 맞춰 누른 버튼이 사라졌으면(해지하기 → 해지 취소 등) 초점을 남은 첫 버튼으로 옮깁니다.
  useEffect(() => {
    if (!restoreFocus.current) return;
    restoreFocus.current = false;
    if (document.activeElement === document.body) actionsRef.current?.querySelector('button')?.focus();
  }, [subscription]);

  // 빠르게 두 번 누르면 isPending이 바뀌기 전에 다시 들어오므로 ref로 막습니다.
  // 성공해도 이 화면에 머무르므로 결과와 상관없이 다시 풉니다.
  const submit = (data: SubscriptionChange) => {
    if (submitting.current) return;
    submitting.current = true;
    restoreFocus.current = true;
    change.mutate(data, {
      onError: () => {
        restoreFocus.current = false;
      },
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
      {/* 해지·변경 결과를 읽어 주도록 처음부터 두는 상태 영역입니다. */}
      <output css={statusCss}>
        <span>
          {cancelAtPeriodEnd
            ? `${end}에 해지됩니다. 그때까지 계속 볼 수 있습니다.`
            : `다음 결제일은 ${end}입니다.`}
        </span>
        {pendingPlan && <span>다음 결제일부터 {PLANS[pendingPlan].name} 이용권으로 바뀝니다.</span>}
      </output>
      <div ref={actionsRef} css={actionsCss}>
        {cancelAtPeriodEnd ? (
          <Button pending={change.isPending} onClick={() => submit({ action: 'resume' })}>
            해지 취소
          </Button>
        ) : (
          <>
            {PLAN_IDS.filter((id) => id !== plan && id !== pendingPlan).map((id) => (
              <Button
                key={id}
                variant="outline"
                pending={change.isPending}
                onClick={() => submit({ action: 'change', plan: id })}
              >
                {changeLabel(plan, id)}
              </Button>
            ))}
            {pendingPlan && (
              <Button
                variant="outline"
                pending={change.isPending}
                onClick={() => submit({ action: 'change', plan })}
              >
                변경 예약 취소
              </Button>
            )}
            <Button variant="outline" pending={change.isPending} onClick={cancel}>
              해지하기
            </Button>
          </>
        )}
      </div>
      <AlertMessage css={alertCss}>
        {change.isError ? '요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.' : null}
      </AlertMessage>
    </>
  );
}
