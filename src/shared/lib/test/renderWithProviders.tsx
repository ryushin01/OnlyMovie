import { QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useLocation,
} from '@tanstack/react-router';
import { act, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createQueryClient } from '@/shared/api';
import { routerSearch } from '@/shared/lib/routerSearch';

type Page =
  ReactElement | { element: ReactElement; validateSearch?: (search: Record<string, unknown>) => object };
interface Options {
  /** 모든 화면을 감싸는 레이아웃. 안에서 `<Outlet />`을 그립니다. */
  layout?: () => ReactElement;
}

/** 지금 주소를 글로 보여 줍니다. 이동했는지 확인할 때 씁니다. */
export function Where() {
  const { pathname, searchStr } = useLocation();
  return <p>위치: {decodeURIComponent(pathname + searchStr)}</p>;
}

/**
 * 앱과 같은 라우터로 그립니다. `ui`가 요소이면 모든 주소에서 그것을 그리고,
 * `{ '/watch/$id': <WatchPage />, '*': <Where /> }`처럼 주는 경로는 앱과 같은 경로 이름을 써서
 * 화면의 `getRouteApi('/watch/$id')`가 그대로 동작합니다. 라우터가 첫 화면을 맞출 때까지 기다리므로 `await`로 부릅니다.
 */
export async function renderWithProviders(
  ui: ReactElement | Record<string, Page>,
  initialPath = '/',
  options: Options = {},
) {
  const rootRoute = createRootRoute({ component: options.layout ?? Outlet });
  const pages: Record<string, Page> = isElement(ui) ? { '*': ui } : ui;
  const children = Object.entries(pages).map(([path, page]) => {
    const { element, validateSearch } = isElement(page) ? { element: page, validateSearch: undefined } : page;
    return createRoute({
      getParentRoute: () => rootRoute,
      path: path === '*' ? '/$' : path,
      component: () => element,
      ...(validateSearch && { validateSearch }),
    });
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren(children),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    ...routerSearch,
  });
  // 라우터는 첫 화면을 비동기로 맞춥니다. 다 맞춘 뒤 그려야 테스트가 바로 화면을 찾을 수 있습니다.
  await router.load();
  const queryClient = createQueryClient();
  const result = await act(async () =>
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  );
  return { ...result, queryClient, router };
}

function isElement(value: unknown): value is ReactElement {
  return typeof value === 'object' && value !== null && '$$typeof' in value;
}
