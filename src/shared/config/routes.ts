const withQuery = (path: string, query: Record<string, string>) => {
  const search = new URLSearchParams(query).toString();
  return search ? `${path}?${search}` : path;
};

/** 로그인 뒤 돌아갈 주소처럼 문자열이 필요한 곳에 씁니다. */
export const paths = {
  movie: (id: string) => `/movies/${encodeURIComponent(id)}`,
  watch: (id: string) => `/watch/${encodeURIComponent(id)}`,
  checkout: (plan: string) => `/checkout/${encodeURIComponent(plan)}`,
  login: (next?: string) => withQuery('/login', next ? { next } : {}),
};

type Search = Record<string, string | number | undefined>;

/**
 * 링크와 이동에 넘기는 값입니다. `<Link {...routes.movie(id)}>`처럼 펼쳐 쓰면
 * 경로와 매개변수를 라우터가 타입으로 확인합니다.
 */
export const routes = {
  home: { to: '/' },
  movies: (search: Search = {}) => ({ to: '/movies', search }),
  movie: (id: string) => ({ to: '/movies/$id', params: { id } }),
  watch: (id: string) => ({ to: '/watch/$id', params: { id } }),
  imports: { to: '/imports' },
  plans: { to: '/plans' },
  checkout: (plan: string) => ({ to: '/checkout/$plan', params: { plan } }),
  account: { to: '/account' },
  login: (next?: string) => ({ to: '/login', search: next ? { next } : {} }),
  signup: (next?: string) => ({ to: '/signup', search: next ? { next } : {} }),
} as const;

/** 로그인 뒤 돌아갈 주소는 이 사이트 안의 경로만 받습니다. */
export const safeNext = (next: string | undefined | null) =>
  next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/';

/** 주소의 next 값을 읽습니다. 문자열이 아니면 없는 것으로 봅니다. */
export const nextSearch = (search: Record<string, unknown>): { next?: string } =>
  typeof search.next === 'string' ? { next: search.next } : {};
