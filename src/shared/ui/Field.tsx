import { css } from '@emotion/react';
import { useId, type ReactNode } from 'react';

export interface FieldControlProps {
  id: string;
  required?: boolean;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: (control: FieldControlProps, labelId: string) => ReactNode;
}

const labelCss = css`
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
`;
const hintCss = css`
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 0.9375rem;
`;
const errorCss = css`
  margin: 8px 0 0;
  color: var(--danger);
  font-size: 0.9375rem;
  font-weight: 700;
`;

/** 레이블, 도움말, 오류 안내를 입력 요소와 연결합니다. */
export function Field({ label, required, hint, error, children }: FieldProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label id={labelId} htmlFor={id} css={labelCss}>
        {label}
        {required && ' (필수)'}
      </label>
      {children(
        {
          id,
          required,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy,
        },
        labelId,
      )}
      {hint && (
        <p id={hintId} css={hintCss}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} css={errorCss}>
          오류: {error}
        </p>
      )}
    </div>
  );
}
