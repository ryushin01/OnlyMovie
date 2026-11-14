import { css } from '@emotion/react';
import type { ButtonHTMLAttributes, MouseEvent } from 'react';

export type ButtonVariant = 'primary' | 'outline';

/** Link 등 다른 요소를 버튼 모양으로 만들 때도 씁니다. */
export const buttonCss = (variant: ButtonVariant = 'primary') => css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 22px;
  color: ${variant === 'primary' ? 'var(--on-accent)' : 'var(--ink)'};
  background: ${variant === 'primary' ? 'var(--accent)' : 'transparent'};
  border: 1px solid ${variant === 'primary' ? 'var(--accent)' : 'var(--field-line)'};
  border-radius: 999px;
  font: inherit;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;

  &:hover:not(:disabled):not([aria-disabled='true']) {
    color: ${variant === 'primary' ? 'var(--on-accent)' : 'var(--bg)'};
    background: ${variant === 'primary' ? 'var(--accent-hover)' : 'var(--ink)'};
    border-color: ${variant === 'primary' ? 'var(--accent-hover)' : 'var(--ink)'};
  }

  &:disabled,
  &[aria-disabled='true'] {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /**
   * 요청을 처리하는 중입니다. 초점을 가진 버튼을 `disabled`로 바꾸면 브라우저가 초점을 문서 처음으로 보내므로,
   * `aria-disabled`로 알리고 누르기와 폼 제출만 무시합니다.
   */
  pending?: boolean;
}

export function Button({ variant, type = 'button', pending = false, onClick, ...props }: ButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (pending) {
      // 제출 버튼이면 폼 제출도 함께 막습니다.
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      type={type}
      css={buttonCss(variant)}
      aria-disabled={pending || undefined}
      onClick={handleClick}
      {...props}
    />
  );
}
