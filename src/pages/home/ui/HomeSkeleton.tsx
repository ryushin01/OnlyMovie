import { css } from '@emotion/react';
import { skeletonCss, visuallyHidden } from '@/shared/ui/styles';
import { MovieRowSkeleton } from '@/widgets/movie-row';
import { HOME_TITLE, homeTitleCss } from './FeaturedMovie';

const heroCss = css`
  min-height: clamp(320px, 50vh, 540px);
  border-radius: var(--radius);
`;

/** 메인을 불러오는 동안의 자리. 실제 화면과 같은 크기로 그려 도착할 때 밀리지 않게 합니다. */
export function HomeSkeleton() {
  return (
    <>
      <h1 css={homeTitleCss}>{HOME_TITLE}</h1>
      <output css={visuallyHidden}>영화를 불러오는 중입니다.</output>
      <div aria-hidden="true" css={[skeletonCss, heroCss]} />
      <MovieRowSkeleton wide />
      <MovieRowSkeleton wide />
    </>
  );
}
