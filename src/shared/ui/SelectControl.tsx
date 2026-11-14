import { css } from '@emotion/react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronIcon } from './icons';
import { inputCss } from './styles';

/** 테두리(1px)와 안쪽 여백(14px). 글자가 칸 왼쪽 끝에서 떨어진 거리이자, 화살표가 오른쪽 끝에서 떨어질 거리입니다. */
const INSET = 15;
const ARROW = 16;
/** 화살표와 고른 글자 사이 */
const GAP = 8;

const wrapCss = css`
  position: relative;
  display: block;
`;
const selectCss = css`
  appearance: none;
  /* 안쪽 여백은 테두리를 뺀 값이므로 1px을 덜어 냅니다. */
  padding-right: ${INSET - 1 + ARROW + GAP}px;
  cursor: pointer;
`;
const arrowCss = css`
  position: absolute;
  top: 50%;
  right: ${INSET}px;
  width: ${ARROW}px;
  height: ${ARROW}px;
  color: var(--muted);
  transform: translateY(-50%);
  pointer-events: none;
`;

/**
 * 브라우저 기본 화살표는 위치를 맞출 수 없어 숨기고, 화살표를 직접 그려 왼쪽 글자와 같은 간격에 둡니다.
 * 화살표는 꾸밈이라 보조기기에서 숨기고, 누르면 아래의 셀렉트가 열리도록 포인터를 통과시킵니다.
 */
export function SelectControl({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span css={wrapCss}>
      <select className={className} css={[inputCss, selectCss]} {...props} />
      <ChevronIcon direction="down" css={arrowCss} />
    </span>
  );
}
