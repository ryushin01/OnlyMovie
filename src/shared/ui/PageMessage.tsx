import { css } from '@emotion/react';
import type { ReactNode } from 'react';

const wrapCss = css`
  padding-block: clamp(64px, 12vw, 160px);
`;
const titleCss = css`
  margin: 0 0 24px;
  font-size: clamp(1.75rem, 4.5vw, 3.25rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
  word-break: keep-all;
`;

/** 빈 상태, 찾을 수 없음, 오류처럼 본문 대신 보여 주는 안내입니다. */
export function PageMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div css={wrapCss}>
      <h1 css={titleCss}>{title}</h1>
      {children}
    </div>
  );
}
