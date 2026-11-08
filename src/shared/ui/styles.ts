import { css, keyframes } from '@emotion/react';

export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

export const inputCss = css`
  width: 100%;
  min-height: 48px;
  padding: 10px 14px;
  color: var(--ink);
  background: var(--field);
  border: 1px solid var(--field-line);
  border-radius: var(--radius-sm);
  font: inherit;

  &[aria-invalid='true'] {
    border: 2px solid var(--danger);
  }

  &::file-selector-button {
    min-height: 32px;
    margin-right: 12px;
    padding: 0 12px;
    color: var(--bg);
    background: var(--ink);
    border: 0;
    border-radius: 999px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
`;

/** 화면의 h1. 콘텐츠가 앞에 나오도록 크기를 절제합니다. */
export const pageTitleCss = css`
  margin: 0;
  padding-block: clamp(12px, 2vw, 24px) 12px;
  font-size: clamp(1.625rem, 3vw, 2.25rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
`;

export const formTitleCss = css`
  ${pageTitleCss}
  padding-block: 0 20px;
`;

/** 구역 제목. 앞의 고리 표시는 장식입니다. */
export const sectionTitleCss = css`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: clamp(1.0625rem, 1.5vw, 1.25rem);
  font-weight: 700;
  letter-spacing: -0.01em;

  &::before {
    content: '';
    flex: none;
    width: 16px;
    height: 16px;
    background: radial-gradient(circle, var(--accent) 0 3px, transparent 3.5px);
    border: 2px solid var(--accent);
    border-radius: 50%;
  }
`;

/** 내용을 묶는 둥근 면 */
export const panelCss = css`
  padding: clamp(20px, 2.5vw, 28px);
  background: var(--surface);
  border-radius: var(--radius);
`;

/** 로그인, 회원가입처럼 폼 하나만 있는 화면의 면 */
export const formPanelCss = css`
  ${panelCss}
  /* 폼의 최대 폭(420px)에 안쪽 여백을 더한 값입니다. */
  max-width: 476px;
  margin: clamp(12px, 4vw, 48px) auto 0;
`;

/** 어두운 배경 이미지 위의 외곽선 버튼. 테마와 상관없이 흰색으로 그립니다. */
export const onImageButtonCss = css`
  color: #fff;
  background: transparent;
  border-color: #fff;

  &:hover:not(:disabled) {
    color: #111;
    background: #fff;
  }
`;

/** 작품에 붙는 짧은 표식 */
export const badgeCss = css`
  display: inline-block;
  padding: 3px 10px;
  color: var(--on-accent);
  background: var(--accent);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
`;

const shimmer = keyframes`
  from {
    background-position: 100% 0;
  }
  to {
    background-position: 0 0;
  }
`;

/** 내용을 불러오는 동안의 자리. 움직임을 줄이도록 설정한 사용자에게는 멈춘 색면으로 보입니다. */
export const skeletonCss = css`
  background-color: var(--surface);
  background-image: linear-gradient(90deg, var(--surface) 25%, var(--skeleton) 50%, var(--surface) 75%);
  background-size: 300% 100%;
  animation: ${shimmer} 1.6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    background-image: none;
    animation: none;
  }
`;
