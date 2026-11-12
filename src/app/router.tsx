import { createRootRoute, createRoute, createRouter, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { movieSearch } from '@/entities/movie';
import { AccountPage } from '@/pages/account';
import { CheckoutPage } from '@/pages/checkout';
import { HomePage } from '@/pages/home';
import { ImportsPage } from '@/pages/imports';
import { LoginPage } from '@/pages/login';
import { MovieDetailPage } from '@/pages/movie-detail';
import { MovieListPage } from '@/pages/movie-list';
import { NotFoundPage } from '@/pages/not-found';
import { PlansPage } from '@/pages/plans';
import { RouteErrorPage } from '@/pages/route-error';
import { SignupPage } from '@/pages/signup';
import { WatchPage } from '@/pages/watch';
import { nextSearch } from '@/shared/config/routes';
import { routerSearch } from '@/shared/lib/routerSearch';
import { reportError } from './monitoring';
import { SiteLayout } from '@/widgets/site-layout';

function Root() {
  const { hash } = useLocation();
  const navigate = useNavigate();

  // 가입 확인·비밀번호 재설정 메일의 링크는 사이트 첫 화면으로 들어옵니다. 토큰을 처리할 로그인 화면으로 넘깁니다.
  useEffect(() => {
    if (/(recovery|confirmation|access)_token=/.test(hash)) navigate({ to: '/login', hash, replace: true });
  }, [hash, navigate]);

  return <SiteLayout />;
}

const rootRoute = createRootRoute({
  component: Root,
  // 머리글까지 그리지 못한 경우의 마지막 안내입니다. 화면 하나가 실패하면 라우터의
  // defaultErrorComponent가 본문 자리에 그려 머리글이 남고 다른 화면으로 갈 수 있습니다.
  errorComponent: () => (
    <main>
      <RouteErrorPage />
    </main>
  ),
  notFoundComponent: NotFoundPage,
});

export const routeTree = rootRoute.addChildren([
  createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage }),
  // 검색 조건은 주소가 원본입니다. 잘못된 값은 조건이 없는 것으로 봅니다.
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/movies',
    component: MovieListPage,
    validateSearch: movieSearch,
  }),
  createRoute({ getParentRoute: () => rootRoute, path: '/movies/$id', component: MovieDetailPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/watch/$id', component: WatchPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/imports', component: ImportsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/plans', component: PlansPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/checkout/$plan', component: CheckoutPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/account', component: AccountPage }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LoginPage,
    validateSearch: nextSearch,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/signup',
    component: SignupPage,
    validateSearch: nextSearch,
  }),
]);

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
  defaultErrorComponent: RouteErrorPage,
  // 라우터가 잡은 화면 오류는 전역으로 올라가지 않으므로 직접 보냅니다.
  defaultOnCatch: (error) => reportError(error),
  scrollRestoration: true,
  ...routerSearch,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
