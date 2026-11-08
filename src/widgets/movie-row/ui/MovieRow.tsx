import { css } from '@emotion/react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import type { routes } from '@/shared/config/routes';
import { MovieCard, type Movie } from '@/entities/movie';
import { ChevronIcon } from '@/shared/ui/icons';
import { sectionTitleCss, visuallyHidden } from '@/shared/ui/styles';

const GAP = 'clamp(8px, 1vw, 16px)';

export const rowSectionCss = css`
  margin-top: clamp(28px, 3.5vw, 48px);
`;
export const rowHeadCss = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;
export const rowTitleCss = sectionTitleCss;
const toolsCss = css`
  display: flex;
  align-items: center;
  gap: 12px;
`;
const moreCss = css`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--muted);
  font-size: 0.9375rem;
  font-weight: 700;
`;
/* 터치 화면은 손가락으로 밀어 넘깁니다. */
const controlsCss = css`
  @media (hover: none) {
    display: none;
  }
`;
const trackCss = css`
  position: relative;
`;
/** 썸네일 위에 놓이므로 테마와 상관없이 어두운 바탕에 민트로 그립니다. */
const controlCss = css`
  position: absolute;
  top: 34%;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: #3ddc91;
  background: rgb(31 34 48 / 0.85);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  --focus: #fff;

  &[aria-disabled='true'] {
    opacity: 0.4;
    cursor: default;
  }
`;
/**
 * 화면 폭에 따라 한 줄에 보이는 카드 수가 달라집니다.
 * 소수점만큼 다음 카드가 살짝 보여 옆으로 더 있다는 것을 알려 줍니다.
 */
export const rowListCss = css`
  --cards: 2.3;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - (var(--cards) - 1) * ${GAP}) / var(--cards));
  gap: ${GAP};
  /* 좌우 끝까지 이어지게 본문 여백을 넘어 그리고, 초점 표시가 잘리지 않게 안쪽 여백을 둡니다. */
  margin: 0 calc(-1 * var(--gutter));
  padding: 4px var(--gutter) 8px;
  overflow-x: auto;
  list-style: none;
  scroll-padding-inline: var(--gutter);
  scroll-snap-type: x proximity;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
  li {
    min-width: 0;
    scroll-snap-align: start;
  }
  @media (min-width: 480px) {
    --cards: 3.3;
  }
  @media (min-width: 768px) {
    --cards: 4.3;
  }
  @media (min-width: 1100px) {
    --cards: 5.3;
  }
  @media (min-width: 1440px) {
    --cards: 6.3;
  }
  @media (min-width: 1920px) {
    --cards: 8.3;
  }
`;

/** 가로로 긴 카드는 한 줄에 더 적게 놓습니다. */
export const rowWideCss = css`
  --cards: 1.4;

  @media (min-width: 480px) {
    --cards: 2.3;
  }
  @media (min-width: 900px) {
    --cards: 3.3;
  }
  @media (min-width: 1280px) {
    --cards: 4.3;
  }
  @media (min-width: 1920px) {
    --cards: 5.3;
  }
`;

interface Props {
  title: string;
  movies: Movie[];
  /** 전체 보기로 갈 리스트 주소 */
  /** 더 보기 링크. `routes.movies(조건)`을 넘깁니다. */
  moreTo?: ReturnType<typeof routes.movies>;
  /** 작품별로 카드에 덧붙일 글 (남은 시간 등) */
  notes?: Record<string, string>;
  /** 작품별 본 비율 (0~1) */
  progress?: Record<string, number>;
  /** 포스터 대신 가로로 긴 카드로 그립니다. */
  wide?: boolean;
  /** 작품별로 카드 위에 놓을 조작 */
  cardAction?: (movie: Movie) => ReactNode;
}

/** 제목 하나와 옆으로 넘기는 포스터 한 줄입니다. */
export function MovieRow({ title, movies, moreTo, notes, progress, wide = false, cardAction }: Props) {
  const titleId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () =>
      setEdges({
        start: list.scrollLeft <= 1,
        end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 1,
      });
    update();
    list.addEventListener('scroll', update, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(list);
    return () => {
      list.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, [movies.length]);

  const move = (direction: 1 | -1) => {
    const list = listRef.current;
    if (!list || edges[direction === 1 ? 'end' : 'start']) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    list.scrollBy({ left: direction * list.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <section aria-labelledby={titleId} css={rowSectionCss}>
      <div css={rowHeadCss}>
        <h2 id={titleId} css={rowTitleCss}>
          {title}
        </h2>
        <div css={toolsCss}>
          {moreTo && (
            <Link {...moreTo} css={moreCss}>
              <span css={visuallyHidden}>{title}</span> 전체 보기
            </Link>
          )}
        </div>
      </div>
      <div css={trackCss}>
        {!(edges.start && edges.end) && (
          <div css={controlsCss}>
            <button
              type="button"
              css={[controlCss, { left: 4 }]}
              aria-label={`${title} 이전 목록`}
              aria-disabled={edges.start}
              onClick={() => move(-1)}
            >
              <ChevronIcon direction="left" width={20} height={20} />
            </button>
            <button
              type="button"
              css={[controlCss, { right: 4 }]}
              aria-label={`${title} 다음 목록`}
              aria-disabled={edges.end}
              onClick={() => move(1)}
            >
              <ChevronIcon direction="right" width={20} height={20} />
            </button>
          </div>
        )}
        <ul ref={listRef} css={[rowListCss, wide && rowWideCss]}>
          {movies.map((movie) => (
            <li key={movie.id}>
              <MovieCard
                movie={movie}
                note={notes?.[movie.id]}
                wide={wide}
                progress={progress?.[movie.id]}
                action={cardAction?.(movie)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
