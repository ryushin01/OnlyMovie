import { css, Global } from '@emotion/react';
// 제목: Oswald(영문)·검은고딕(한글), 본문: Roboto(영문·숫자)·Gothic A1(한글)
import '@fontsource-variable/oswald/index.css';
import '@fontsource/black-han-sans/400.css';
import '@fontsource/gothic-a1/400.css';
import '@fontsource/gothic-a1/700.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/700.css';

const styles = css`
  :root {
    --gutter: clamp(16px, 3vw, 48px);
    --radius: 20px;
    --radius-sm: 12px;
    color-scheme: light;
    --bg: #eceef3;
    --rail: #ffffff;
    --surface: #ffffff;
    --field: #ffffff;
    --skeleton: #dfe2ea;
    --ink: #1f2230;
    --muted: #555b6d;
    --accent: #0a7446;
    --accent-hover: #085c38;
    --on-accent: #ffffff;
    --danger: #b3261e;
    --focus: #0a7446;
    --field-line: #7a8092;
    --shadow: 0 8px 28px rgb(31 34 48 / 0.1);
  }
  :root[data-theme='dark'] {
    color-scheme: dark;
    --bg: #2a2d3a;
    --rail: #1f2230;
    --surface: #383c4d;
    --field: #1f2230;
    --skeleton: #4a4f62;
    --ink: #f4f5f8;
    --muted: #b9bece;
    --accent: #3ddc91;
    --accent-hover: #6be8ad;
    --on-accent: #10231a;
    --danger: #ff9c94;
    --focus: #3ddc91;
    --field-line: #8f95a8;
    --shadow: 0 8px 28px rgb(0 0 0 / 0.28);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  html {
    -webkit-text-size-adjust: 100%;
  }
  /* 극장 포스터처럼 좁은 대문자와 굵은 한글. 검은고딕은 굵기가 하나라 가짜 굵기를 만들지 않습니다. */
  h1,
  h2 {
    /* 대체 글꼴: 포스터 글씨처럼 좁은 대문자(맥 Avenir Next Condensed, 윈도 Arial Narrow)와 운영체제 한글 고딕 */
    font-family:
      'Oswald Variable', 'Black Han Sans', 'Avenir Next Condensed', 'Arial Narrow', 'Apple SD Gothic Neo',
      'Malgun Gothic', 'Noto Sans CJK KR', sans-serif;
    font-synthesis-weight: none;
  }
  body {
    margin: 0;
    color: var(--ink);
    background: var(--bg);
    font-family:
      Roboto, 'Gothic A1', 'Segoe UI', 'Helvetica Neue', 'Apple SD Gothic Neo', 'Malgun Gothic',
      'Noto Sans CJK KR', system-ui, sans-serif;
    font-size: 1rem;
    line-height: 1.5;
    /* 한글이 단어 중간에서 끊기지 않게 하되, 긴 문자열은 넘치지 않게 합니다. */
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
  a {
    color: var(--accent);
  }
  ::placeholder {
    color: var(--muted);
    opacity: 1;
  }
  :focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      transition: none !important;
      scroll-behavior: auto !important;
    }
  }
`;

export const GlobalStyles = () => <Global styles={styles} />;
