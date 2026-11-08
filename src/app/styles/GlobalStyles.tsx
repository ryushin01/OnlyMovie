import { css, Global } from '@emotion/react';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';

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
  body {
    margin: 0;
    color: var(--ink);
    background: var(--bg);
    font-family: 'Pretendard Variable', Pretendard, system-ui, sans-serif;
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
