import { css } from '@emotion/react';
import { MovieCardSkeleton } from '@/entities/movie';
import { skeletonCss } from '@/shared/ui/styles';
import { rowHeadCss, rowListCss, rowSectionCss, rowTitleCss, rowWideCss } from './MovieRow';

const CARDS = 9;

const titleLineCss = css`
  width: 160px;
  max-width: 50%;
  height: 1.5em;
  border-radius: 2px;
`;

/** 작품 줄을 불러오는 동안의 자리. 제목을 아직 모르면 막대로 대신합니다. */
export function MovieRowSkeleton({ title, wide = false }: { title?: string; wide?: boolean }) {
  return (
    <div css={rowSectionCss}>
      <div css={rowHeadCss}>
        {title ? (
          <h2 css={rowTitleCss}>{title}</h2>
        ) : (
          <div aria-hidden="true" css={[skeletonCss, titleLineCss]} />
        )}
      </div>
      <div aria-hidden="true" css={[rowListCss, wide && rowWideCss, { overflowX: 'hidden' }]}>
        {Array.from({ length: CARDS }, (_, index) => (
          <MovieCardSkeleton key={index} wide={wide} />
        ))}
      </div>
    </div>
  );
}
