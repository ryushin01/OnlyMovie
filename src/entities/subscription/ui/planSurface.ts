import { css } from '@emotion/react';
import type { PlanId } from '../model/plans';

/** 흰 글자와 4.5:1 이상을 유지하는 이용권별 색 */
const PLAN_COLORS: Record<PlanId, string> = {
  basic: '#2b5be0',
  standard: '#c9286b',
  premium: '#d2352f',
};

/** 이용권 색면. 안쪽의 버튼, 초점 표시, 오류 글자가 색면 위에서도 보이도록 색 변수를 다시 정합니다. */
export const planSurfaceCss = (plan: PlanId) => css`
  --ink: #ffffff;
  --muted: #ffffff;
  --bg: #1f2230;
  --accent: #ffffff;
  --accent-hover: #e3e5ec;
  --on-accent: #1f2230;
  --danger: #ffffff;
  --focus: #ffffff;
  --field-line: #ffffff;
  color: #ffffff;
  background: ${PLAN_COLORS[plan]};
`;
