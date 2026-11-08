import { css } from '@emotion/react';
import { Link } from '@tanstack/react-router';
import { formatDate, MoviePoster, useMovies, type Movie } from '@/entities/movie';
import { ReleaseAlertButton } from '@/features/release-alerts';
import { routes } from '@/shared/config/routes';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';
import { pageTitleCss, panelCss, sectionTitleCss } from '@/shared/ui/styles';

const introCss = css`
  max-width: 44rem;
  margin: 0;
`;
const sectionCss = css`
  margin-top: clamp(24px, 3vw, 40px);

  h2 {
    ${sectionTitleCss}
    margin-bottom: 16px;
  }
`;
const listCss = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(420px, 100%), 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
`;
const articleCss = css`
  ${panelCss}
  display: grid;
  gap: 16px;
  height: 100%;
  padding: 16px;

  img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: var(--radius-sm);
  }
  h3 {
    margin: 0 0 2px;
    font-size: 1.125rem;
    font-weight: 700;
  }
  h3 a {
    color: inherit;
  }
`;
const metaCss = css`
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 0.875rem;
`;
const noteCss = css`
  margin: 0;
`;

function ImportStory({ movie, upcoming }: { movie: Movie; upcoming?: boolean }) {
  return (
    <article css={articleCss}>
      <MoviePoster movie={movie} backdrop />
      <div>
        <h3>
          <Link {...routes.movie(movie.id)}>{movie.title}</Link>
        </h3>
        <p css={metaCss}>
          {movie.year} · {movie.country} · {movie.director}
          {upcoming && ` · ${formatDate(movie.releasedOn)} 공개`}
        </p>
        <p css={noteCss}>{movie.importNote}</p>
        {upcoming && (
          <div css={{ marginTop: 12 }}>
            <ReleaseAlertButton movieId={movie.id} />
          </div>
        )}
      </div>
    </article>
  );
}

/** 작품을 어떻게 들여왔는지를 앞세운 국내 첫 공개작 모음입니다. */
export function ImportsPage() {
  useDocumentTitle('수입 기획전');
  const now = useMovies({ firstImport: true, status: 'now' });
  const upcoming = useMovies({ firstImport: true, status: 'upcoming' });

  return (
    <>
      <h1 css={pageTitleCss}>수입 기획전</h1>
      <p css={introCss}>
        국내에 한 번도 소개되지 않은 영화를 어떻게 찾아 들여왔는지, 그 이야기와 함께 만나 보세요.
      </p>
      {(now.isPending || upcoming.isPending) && (
        <output css={{ display: 'block', marginTop: 32 }}>영화를 불러오는 중입니다.</output>
      )}
      {(now.isError || upcoming.isError) && (
        <p role="alert" css={{ marginTop: 32 }}>
          영화를 불러오지 못했습니다. 새로고침해 주세요.
        </p>
      )}
      {upcoming.data && upcoming.data.items.length > 0 && (
        <section css={sectionCss} aria-labelledby="imports-upcoming">
          <h2 id="imports-upcoming">곧 들어오는 작품</h2>
          <ul css={listCss}>
            {upcoming.data.items.map((movie) => (
              <li key={movie.id}>
                <ImportStory movie={movie} upcoming />
              </li>
            ))}
          </ul>
        </section>
      )}
      {now.data && now.data.items.length > 0 && (
        <section css={sectionCss} aria-labelledby="imports-now">
          <h2 id="imports-now">지금 만나는 국내 첫 공개</h2>
          <ul css={listCss}>
            {now.data.items.map((movie) => (
              <li key={movie.id}>
                <ImportStory movie={movie} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
