import { css } from '@emotion/react';
import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { useSession } from '@/entities/session';
import { LogoutButton } from '@/features/logout';
import { AlertBell } from '@/features/release-alerts';
import { MovieSearch } from '@/features/search-movies';
import { ThemeToggle } from '@/features/toggle-theme';
import { routes } from '@/shared/config/routes';
import { buttonCss } from '@/shared/ui/Button';
import { FilmIcon, HomeIcon, LoginIcon, PlayIcon, StarIcon, TicketIcon, UserIcon } from '@/shared/ui/icons';

/** 레일이 왼쪽에 서고, 좁은 화면에서는 아래쪽 탭 막대가 되는 폭 */
const WIDE = '@media (min-width: 768px)';

const skipCss = css`
  position: absolute;
  top: -100px;
  left: 16px;
  z-index: 30;
  padding: 12px 16px;
  color: var(--bg);
  background: var(--ink);
  border-radius: var(--radius-sm);

  &:focus {
    top: 16px;
  }
`;
const shellCss = css`
  /* 아래쪽 탭 막대에 내용이 가리지 않게 합니다. */
  padding-bottom: calc(72px + env(safe-area-inset-bottom));

  ${WIDE} {
    padding-bottom: 0;
    padding-left: 104px;
  }
`;
const headerCss = css`
  display: grid;
  grid-template-areas: 'logo tools' 'search search';
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px 16px;
  padding: 16px var(--gutter);

  & > search {
    grid-area: search;
  }

  ${WIDE} {
    grid-template-areas: 'logo search tools';
    grid-template-columns: auto minmax(0, 1fr) auto;
  }
`;
const logoCss = css`
  grid-area: logo;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  color: inherit;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-decoration: none;

  svg {
    color: var(--accent);
  }
`;
const toolsCss = css`
  grid-area: tools;
  display: flex;
  align-items: center;
  gap: 6px;

  > a,
  > button {
    min-height: 44px;
    padding-inline: 12px;
  }

  ${WIDE} {
    gap: 8px;

    > a,
    > button {
      padding-inline: 16px;
    }
  }
`;
const railCss = css`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  gap: 4px;
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  background: var(--rail);
  box-shadow: var(--shadow);

  ${WIDE} {
    top: 16px;
    right: auto;
    bottom: 16px;
    left: 16px;
    flex-direction: column;
    width: 88px;
    padding: 12px 8px;
    overflow-y: auto;
    border-radius: 24px;
  }
`;
const railLinkCss = css`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 56px;
  color: var(--muted);
  border-radius: 14px;
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  transition:
    color 0.15s,
    background 0.15s;

  &:hover {
    color: var(--ink);
  }

  /* 색만으로 구분하지 않도록 지금 화면은 면과 막대도 함께 표시합니다. */
  &[aria-current='page'] {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    box-shadow: inset 0 3px 0 var(--accent);
    font-weight: 800;
  }

  ${WIDE} {
    flex: none;
    min-height: 64px;

    &[aria-current='page'] {
      box-shadow: inset 3px 0 0 var(--accent);
    }
  }
`;
const mainCss = css`
  /* 내용이 늦게 그려져도 바닥글이 밀려 내려가지 않게 합니다. */
  min-height: 100svh;
  padding-inline: var(--gutter);
  padding-bottom: 72px;

  /* 키보드 사용자에게만 표시되며, 화면 가장자리에서 잘리지 않게 안쪽에 그립니다. */
  &:focus-visible {
    outline-offset: -3px;
  }
`;
const footerCss = css`
  padding: 24px var(--gutter);
  color: var(--muted);
`;

export function SiteLayout() {
  const { user, isPending } = useSession();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);

  // 화면이 바뀌면 스크린 리더와 키보드 사용자가 새 본문에서 시작하도록 합니다.
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div css={shellCss}>
      <a href="#main" css={skipCss}>
        본문 바로가기
      </a>
      <header css={headerCss}>
        <Link {...routes.home} activeOptions={{ exact: true }} css={logoCss}>
          <PlayIcon />
          OnlyMovie
        </Link>
        <MovieSearch />
        <div css={toolsCss}>
          <AlertBell />
          {isPending ? null : user ? (
            <LogoutButton />
          ) : (
            <Link activeOptions={{ includeSearch: false }} {...routes.signup()} css={buttonCss()}>
              회원가입
            </Link>
          )}
          <ThemeToggle />
        </div>
        <nav aria-label="주요 메뉴" css={railCss}>
          <Link {...routes.home} activeOptions={{ exact: true }} css={railLinkCss}>
            <HomeIcon />홈
          </Link>
          <Link activeOptions={{ includeSearch: false }} {...routes.movies()} css={railLinkCss}>
            <FilmIcon />
            영화
          </Link>
          <Link activeOptions={{ includeSearch: false }} {...routes.plans} css={railLinkCss}>
            <TicketIcon />
            이용권
          </Link>
          <Link activeOptions={{ includeSearch: false }} {...routes.imports} css={railLinkCss}>
            <StarIcon />
            기획전
          </Link>
          {/* 확인이 끝나기 전에는 회원에게 로그인 메뉴가 깜빡이지 않도록 둘 다 숨깁니다. */}
          {isPending ? (
            <span aria-hidden="true" css={[railLinkCss, { visibility: 'hidden' }]} />
          ) : user ? (
            <Link activeOptions={{ includeSearch: false }} {...routes.account} css={railLinkCss}>
              <UserIcon />내 계정
            </Link>
          ) : (
            <Link activeOptions={{ includeSearch: false }} {...routes.login()} css={railLinkCss}>
              <LoginIcon />
              로그인
            </Link>
          )}
        </nav>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1} css={mainCss}>
        <Outlet />
      </main>
      <footer css={footerCss}>
        <small>
          OnlyMovie · 포트폴리오 프로젝트입니다. 영화와 인물은 모두 가상이고, 결제는 실제로 이루어지지 않으며,
          영상도 재생되지 않습니다.
        </small>
      </footer>
    </div>
  );
}
