import { css } from '@emotion/react';
import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { routes } from '@/shared/config';
import { PlayIcon } from '@/shared/ui/icons';
import { badgeCss } from '@/shared/ui/styles';
import { formatDate, isReleased, type Movie } from '../model/types';
import { MoviePoster } from './MoviePoster';

const cardCss = css`
  position: relative;
  margin: 0;

  @media (prefers-reduced-motion: no-preference) {
    &:hover img {
      transform: scale(1.05);
    }
  }
  &:hover a,
  &:focus-within a {
    color: var(--accent);
  }
  &:hover [data-play],
  &:focus-within [data-play] {
    opacity: 1;
  }
`;
const frameCss = css`
  position: relative;
  overflow: hidden;
  aspect-ratio: 2 / 3;
  background: var(--surface);
  border-radius: var(--radius-sm);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
`;
const wideFrameCss = css`
  aspect-ratio: 16 / 9;
`;
const cardBadgeCss = css`
  ${badgeCss}
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
`;
const playCss = css`
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  color: #fff;
  background: rgb(31 34 48 / 0.6);
  border: 2px solid #fff;
  border-radius: 50%;
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: opacity 0.2s ease;
`;
const progressCss = css`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  height: 4px;
  background: rgb(255 255 255 / 0.35);

  span {
    display: block;
    height: 100%;
    background: var(--accent);
  }
`;
const actionCss = css`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
`;
const titleCss = css`
  display: -webkit-box;
  overflow: hidden;
  margin: 10px 0 2px;
  font-size: clamp(0.9375rem, 1.1vw, 1.0625rem);
  font-weight: 700;
  line-height: 1.3;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  a {
    color: inherit;
    text-decoration: none;
  }
  /* 카드 전체를 누를 수 있게 합니다. */
  a::after {
    content: '';
    position: absolute;
    inset: 0;
  }
`;
const metaCss = css`
  margin: 0;
  color: var(--muted);
  font-size: 0.8125rem;
`;

interface Props {
  movie: Movie;
  note?: string;
  /** 가로로 긴 배경 이미지로 그립니다. */
  wide?: boolean;
  /** 본 비율(0~1). 남은 시간은 note가 글자로 알려 주므로 막대는 장식입니다. */
  progress?: number;
  /** 썸네일 오른쪽 위에 놓을 조작 */
  action?: ReactNode;
}

export function MovieCard({ movie, note, wide = false, progress, action }: Props) {
  const [now] = useState(() => new Date());
  const released = isReleased(movie, now);
  return (
    <article css={cardCss}>
      <div css={[frameCss, wide && wideFrameCss]}>
        {(!released || movie.firstImport) && (
          <span css={cardBadgeCss}>{released ? '국내 첫 공개' : `${formatDate(movie.releasedOn)} 공개`}</span>
        )}
        <MoviePoster movie={movie} backdrop={wide} />
        {wide && (
          <span css={playCss} data-play="" aria-hidden="true">
            <PlayIcon />
          </span>
        )}
        {progress !== undefined && (
          <span css={progressCss} aria-hidden="true">
            <span style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }} />
          </span>
        )}
      </div>
      {action && <div css={actionCss}>{action}</div>}
      <h3 css={titleCss}>
        <Link {...routes.movie(movie.id)}>{movie.title}</Link>
      </h3>
      <p css={metaCss}>
        {movie.year} · {movie.country}
      </p>
      {note && <p css={metaCss}>{note}</p>}
    </article>
  );
}
