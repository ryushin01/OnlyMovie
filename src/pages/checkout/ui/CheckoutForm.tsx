import { css } from '@emotion/react';
import { useRef, useState, type FormEvent } from 'react';
import { formatPrice, useSubscribe, type Plan } from '@/entities/subscription';
import { ApiError } from '@/shared/api';
import { AlertMessage } from '@/shared/ui/AlertMessage';
import { Button } from '@/shared/ui/Button';

const formCss = css`
  display: grid;
  gap: 24px;
  max-width: 520px;
`;
const fieldsetCss = css`
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 16px;
  border: 1px solid var(--field-line);

  legend {
    padding-inline: 8px;
    font-weight: 700;
  }
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  input {
    width: 24px;
    height: 24px;
    margin: 0;
    accent-color: var(--accent);
  }
`;
const alertCss = css`
  margin-bottom: 16px;
  color: var(--danger);
  font-weight: 700;
`;

const failureMessage = (error: unknown) => {
  const status = error instanceof ApiError ? error.status : 0;
  if (status === 402) return '가상 결제에 실패했습니다. 이용권은 시작되지 않았습니다. 다시 시도해 주세요.';
  if (status === 409) return '이미 이용 중인 이용권이 있습니다. 내 계정에서 변경해 주세요.';
  if (status === 401) return '로그인이 끝났습니다. 다시 로그인한 뒤 결제해 주세요.';
  return '결제를 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
};

/** 실제 결제 정보를 받지 않습니다. 성공과 실패 흐름을 모두 볼 수 있게 결과를 고릅니다. */
export function CheckoutForm({ plan, onDone }: { plan: Plan; onDone: () => void }) {
  const [result, setResult] = useState<'success' | 'failure'>('success');
  const subscribe = useSubscribe();
  const submitting = useRef(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // 빠르게 두 번 누르면 isPending이 바뀌기 전에 다시 들어오므로 ref로 막습니다.
    if (submitting.current) return;
    submitting.current = true;
    subscribe.mutate(
      { plan: plan.id, simulateFailure: result === 'failure' },
      {
        onSuccess: onDone,
        // 성공하면 화면을 떠나므로 실패했을 때만 다시 제출할 수 있게 합니다.
        onError: () => {
          submitting.current = false;
        },
      },
    );
  };

  return (
    <form css={formCss} onSubmit={handleSubmit}>
      <fieldset css={fieldsetCss}>
        <legend>가상 결제 결과</legend>
        <label>
          <input
            type="radio"
            name="result"
            checked={result === 'success'}
            onChange={() => setResult('success')}
          />
          결제 성공
        </label>
        <label>
          <input
            type="radio"
            name="result"
            checked={result === 'failure'}
            onChange={() => setResult('failure')}
          />
          결제 실패
        </label>
      </fieldset>
      <div>
        {/* 안내 영역은 처음부터 두고 내용만 바꿉니다. 초점은 결제 버튼에 그대로 둡니다. */}
        <AlertMessage css={alertCss}>
          {subscribe.isError ? failureMessage(subscribe.error) : null}
        </AlertMessage>
        <Button type="submit" pending={subscribe.isPending}>
          {subscribe.isPending ? '결제 중…' : `${formatPrice(plan.price)} 가상 결제`}
        </Button>
      </div>
    </form>
  );
}
