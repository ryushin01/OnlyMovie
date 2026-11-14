import { css } from '@emotion/react';
import { useEffect, useId, useState, type ReactNode } from 'react';

const wrapCss = css`
  position: relative;
  display: inline-flex;
`;
const tipCss = css`
  position: absolute;
  top: calc(100% + 8px);
  z-index: 30;
  padding: 6px 10px;
  color: var(--bg);
  background: var(--ink);
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;

  /* 버튼과 말풍선 사이의 틈을 지나도 닫히지 않게 이어 줍니다. */
  &::before {
    content: '';
    position: absolute;
    right: 0;
    bottom: 100%;
    left: 0;
    height: 8px;
  }
`;
const alignCss = {
  start: css`
    left: 0;
  `,
  end: css`
    right: 0;
  `,
};

interface Props {
  /** 말풍선 글자. 아이콘만 있는 버튼의 이름으로 씁니다. */
  label: string;
  /** 말풍선을 버튼의 어느 쪽 끝에 맞출지. 화면 가장자리의 버튼은 안쪽으로 펼쳐 넘치지 않게 합니다. */
  align?: 'start' | 'end';
  /** 같은 자리에 다른 내용(펼친 목록 등)이 열려 있으면 감춥니다. */
  suppressed?: boolean;
  className?: string;
  children: (trigger: { 'aria-labelledby': string }) => ReactNode;
}

/**
 * 아이콘만 있는 버튼의 툴팁(`role="tooltip"`). 마우스를 올리거나 초점을 받으면 보이고, Esc로 닫습니다.
 * 말풍선 글자가 곧 버튼의 이름이라 `aria-describedby` 대신 `aria-labelledby`로 이어, 같은 말을 두 번 읽지 않게 합니다.
 */
export function Tooltip({ label, align = 'start', suppressed = false, className, children }: Props) {
  const id = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = (hovered || focused) && !dismissed && !suppressed;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDismissed(true);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // 마우스와 초점이 모두 떠나면, 다음에 다시 올 때 보이도록 Esc로 닫은 상태를 풉니다.
  const update = (next: { hovered: boolean; focused: boolean }) => {
    setHovered(next.hovered);
    setFocused(next.focused);
    if (!next.hovered && !next.focused) setDismissed(false);
  };

  return (
    <span
      className={className}
      css={wrapCss}
      onMouseEnter={() => update({ hovered: true, focused })}
      onMouseLeave={() => update({ hovered: false, focused })}
      onFocus={() => update({ hovered, focused: true })}
      onBlur={() => update({ hovered, focused: false })}
    >
      {children({ 'aria-labelledby': id })}
      <span id={id} role="tooltip" css={[tipCss, alignCss[align]]} hidden={!open}>
        {label}
      </span>
    </span>
  );
}
