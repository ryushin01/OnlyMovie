import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import netlify from '@netlify/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// 운영의 CSP를 프로덕션 빌드 E2E에도 그대로 적용해, 정책에 걸리는 코드를 배포 전에 잡습니다.
const contentSecurityPolicy = /Content-Security-Policy = "(.+)"/.exec(
  readFileSync('netlify.toml', 'utf8'),
)![1];

export default defineConfig({
  plugins: [
    react({ jsxImportSource: '@emotion/react' }),
    // 로컬 개발에서 함수·DB·이미지 저장소를 흉내 냅니다. 테스트는 API를 직접 가짜로 대신합니다.
    // 엣지 함수는 쓰지 않습니다. 켜 두면 Deno 버전에 따라 에뮬레이터가 뜨지 못하고 개발 서버까지 종료됩니다.
    ...(process.env.VITEST || process.env.E2E ? [] : [netlify({ edgeFunctions: { enabled: false } })]),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  preview: { headers: { 'Content-Security-Policy': contentSecurityPolicy } },
  // 작은 글꼴 조각을 data: 주소로 넣으면 CSP(font-src 'self')에 막히므로 글꼴은 항상 파일로 내보냅니다.
  build: { assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined) },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/shared/lib/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'netlify/**/*.test.ts'],
  },
});
