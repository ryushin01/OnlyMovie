import { useState } from 'react';
import { skeletonCss } from '@/shared/ui/styles';
import type { Movie } from '../model/types';

interface Props {
  movie: Pick<Movie, 'title' | 'poster'> & Partial<Pick<Movie, 'backdrop'>>;
  /** 포스터 대신 가로로 긴 배경 이미지를 씁니다. 작품 이름이 곁에 있어 대체 텍스트는 비웁니다. */
  backdrop?: boolean;
  loading?: 'lazy' | 'eager';
  className?: string;
}

/**
 * 영화 포스터. 이미지가 도착할 때까지 같은 자리에 스켈레톤을 그려 화면이 밀리지 않게 합니다.
 * 불러오지 못하면 움직임을 멈추고 대체 텍스트를 보여 줍니다.
 */
export function MoviePoster({ movie, loading = 'lazy', className, backdrop = false }: Props) {
  const [settled, setSettled] = useState(false);
  return (
    <img
      className={className}
      css={settled ? undefined : skeletonCss}
      data-skeleton={settled ? undefined : 'poster'}
      src={backdrop ? (movie.backdrop ?? movie.poster) : movie.poster}
      alt={backdrop ? '' : `${movie.title} 포스터`}
      loading={loading}
      onLoad={() => setSettled(true)}
      onError={() => setSettled(true)}
    />
  );
}
