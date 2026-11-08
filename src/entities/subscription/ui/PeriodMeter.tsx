import { css } from '@emotion/react';
import { useState } from 'react';
import { periodProgress } from '../model/plans';

const meterCss = css`
  max-width: 28rem;
  margin-top: 12px;

  p {
    margin: 0 0 6px;
    font-weight: 700;
  }
`;
const trackCss = css`
  height: 6px;
  overflow: hidden;
  background: rgb(255 255 255 / 0.35);
  border-radius: 3px;

  div {
    height: 100%;
    background: #fff;
    border-radius: 3px;
  }
`;

/** 이용권 색면 위에 놓습니다. 남은 날은 글자로 알리고, 막대는 눈으로 가늠하도록 덧붙입니다. */
export function PeriodMeter({ end, label }: { end: string; label: string }) {
  const [now] = useState(() => new Date());
  const { days, ratio } = periodProgress(end, now);
  return (
    <div css={meterCss}>
      <p>
        {label}까지 {days}일
      </p>
      <div css={trackCss} aria-hidden="true">
        <div style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
