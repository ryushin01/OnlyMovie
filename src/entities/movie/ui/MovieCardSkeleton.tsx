import { css } from '@emotion/react';
import { skeletonCss } from '@/shared/ui/styles';

const frameCss = css`
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-sm);
`;
const wideCss = css`
  aspect-ratio: 16 / 9;
`;
const lineCss = css`
  height: 1em;
  margin-top: 10px;
  border-radius: 2px;
`;

/** 작품을 불러오는 동안의 카드 자리. 안내는 목록 쪽에서 한 번만 하므로 스크린 리더에서는 숨깁니다. */
export function MovieCardSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div aria-hidden="true" data-skeleton="card">
      <div css={[skeletonCss, frameCss, wide && wideCss]} />
      <div css={[skeletonCss, lineCss, { width: '70%' }]} />
      <div css={[skeletonCss, lineCss, { width: '45%' }]} />
    </div>
  );
}
