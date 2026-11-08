import type { Page, Route } from '@playwright/test';
import { MOVIES } from '../scripts/seed-movies.mjs';

// vite preview에는 함수가 없으므로 API와 Identity를 브라우저 앞에서 대신합니다.
// 서버 쪽은 netlify/lib 테스트와 live.spec이 검사합니다.

/** 공개 예정작이 늘 같게 보이도록 날짜를 고정합니다. */
const TODAY = '2026-11-06';
const NOW = new Date(`${TODAY}T12:00:00+09:00`);
const PAGE_SIZE = 24;
const PRICES: Record<string, number> = { basic: 7900, standard: 10900, premium: 13900 };

export interface FakeMovie {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  country: string;
  language: string;
  genres: string[];
  director: string;
  writer: string;
  cast: string[];
  runtimeMinutes: number;
  ageRating: string;
  advisories: string[];
  moods: string[];
  audioLanguages: string[];
  subtitleLanguages: string[];
  synopsis: string;
  importNote: string;
  firstImport: boolean;
  releasedOn: string;
  poster: string;
  backdrop: string;
}

export const seedMovies = (): FakeMovie[] =>
  MOVIES.map((row) => {
    const [
      id,
      title,
      originalTitle,
      year,
      country,
      language,
      genres,
      director,
      writer,
      cast,
      runtimeMinutes,
      ageRating,
      advisories,
      moods,
      ,
      ,
      releasedOn,
      firstImport,
      synopsis,
      importNote,
    ] = row as [
      string,
      string,
      string,
      number,
      string,
      string,
      string[],
      string,
      string,
      string[],
      number,
      string,
      string[],
      string[],
      string,
      string,
      string,
      boolean,
      string,
      string,
    ];
    return {
      id,
      title,
      originalTitle,
      year,
      country,
      language,
      genres,
      director,
      writer,
      cast,
      runtimeMinutes,
      ageRating,
      advisories,
      moods,
      audioLanguages: genres.includes('가족') ? [language, '한국어'] : [language],
      subtitleLanguages: ['한국어', '영어'],
      synopsis,
      importNote,
      firstImport,
      releasedOn,
      poster: `/seed/${id}-poster.svg`,
      backdrop: `/seed/${id}-backdrop.svg`,
    };
  });

function search(movies: FakeMovie[], params: URLSearchParams, pageSize = PAGE_SIZE) {
  const get = (key: string) => params.get(key);
  const has = (text: string, term: string) => text.toLowerCase().includes(term.toLowerCase());
  const q = get('q');
  const released = (movie: FakeMovie) => movie.releasedOn <= TODAY;
  const matched = movies.filter(
    (movie) =>
      (!q ||
        [movie.title, movie.originalTitle, movie.director, movie.writer, movie.country, ...movie.cast].some(
          (text) => has(text, q),
        )) &&
      (!get('genre') || movie.genres.includes(get('genre')!)) &&
      (!get('year') || movie.year === Number(get('year'))) &&
      (!get('country') || movie.country === get('country')) &&
      (!get('director') || has(movie.director, get('director')!)) &&
      (!get('actor') || movie.cast.some((actor) => has(actor, get('actor')!))) &&
      (!get('age') || movie.ageRating === get('age')) &&
      (get('runtime') !== 'short' || movie.runtimeMinutes <= 90) &&
      (get('runtime') !== 'medium' || (movie.runtimeMinutes > 90 && movie.runtimeMinutes <= 120)) &&
      (get('runtime') !== 'long' || movie.runtimeMinutes > 120) &&
      (get('status') !== 'now' || released(movie)) &&
      (get('status') !== 'upcoming' || !released(movie)) &&
      (get('firstImport') !== 'true' || movie.firstImport),
  );
  const sort = get('sort');
  matched.sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title, 'ko');
    if (sort === 'year') return b.year - a.year;
    if (sort === 'runtime') return a.runtimeMinutes - b.runtimeMinutes;
    if (get('status') === 'upcoming') return a.releasedOn.localeCompare(b.releasedOn);
    return Number(!released(a)) - Number(!released(b)) || b.releasedOn.localeCompare(a.releasedOn);
  });
  const page = Number(get('page')) || 1;
  return {
    items: matched.slice((page - 1) * pageSize, page * pageSize),
    total: matched.length,
    page,
    pageSize,
  };
}

interface FakeUser {
  id: string;
  email: string;
  name: string | null;
}

interface Options {
  user?: FakeUser | null;
  plan?: 'basic' | 'standard' | 'premium' | null;
  movies?: FakeMovie[];
  /** 운영 설정처럼 가입 뒤 메일 확인을 요구합니다. */
  requireEmailConfirmation?: boolean;
}

export const MEMBER: FakeUser = { id: 'u1', email: 'member@example.com', name: '시네필' };

export async function installFakeApi(
  page: Page,
  { user = null, plan = null, movies = seedMovies(), requireEmailConfirmation = false }: Options = {},
) {
  const subscriptionFor = (id: string) => ({
    plan: id,
    pendingPlan: null as string | null,
    status: 'active',
    cancelAtPeriodEnd: false,
    startedAt: NOW.toISOString(),
    currentPeriodEnd: '2026-12-06T03:00:00.000Z',
  });
  const state = {
    movies,
    user,
    subscription: plan ? subscriptionFor(plan) : null,
    payments: [] as Record<string, unknown>[],
    posts: 0,
    watchlist: [] as string[],
    progress: {} as Record<string, number>,
    alerts: [] as string[],
    alertsRead: [] as string[],
    screensFull: false,
    delay: 0,
  };
  const pay = (id: string, amount: number, kind: string, status = 'paid') =>
    state.payments.unshift({
      id: `p${state.payments.length + 1}`,
      plan: id,
      amount,
      kind,
      status,
      createdAt: NOW.toISOString(),
    });
  const subscriptionData = () => ({ subscription: state.subscription, payments: state.payments });

  await page.clock.setFixedTime(NOW);

  await page.route('**/api/me', (route) => route.fulfill({ json: { user: state.user } }));
  await page.route('**/api/movie-facets', (route) =>
    route.fulfill({
      json: {
        years: [...new Set(state.movies.map((movie) => movie.year))].sort((a, b) => b - a),
        countries: [...new Set(state.movies.map((movie) => movie.country))].sort(),
        directors: [...new Set(state.movies.map((movie) => movie.director))].sort(),
        actors: [...new Set(state.movies.flatMap((movie) => movie.cast))].sort(),
        ageRatings: ['all', '12', '15'],
      },
    }),
  );
  await page.route('**/api/home', (route) => {
    const row = (title: string, query: string) => ({
      title,
      query,
      movies: search(state.movies, new URLSearchParams(query), 16).items,
    });
    const rows = [
      row('국내 첫 공개', 'firstImport=true&status=now'),
      row('공개 예정', 'status=upcoming'),
      row('최근 공개', 'status=now'),
      row('드라마', 'genre=드라마&status=now'),
      row('스릴러', 'genre=스릴러&status=now'),
      row('SF', 'genre=SF&status=now'),
      row('가족', 'genre=가족&status=now'),
    ].filter((item) => item.movies.length > 0);
    return route.fulfill({ json: { featured: rows[0]?.movies[0] ?? null, rows } });
  });
  await page.route('**/api/movies?*', (route) =>
    route.fulfill({ json: search(state.movies, new URL(route.request().url()).searchParams) }),
  );
  await page.route('**/api/movies', (route) =>
    route.fulfill({ json: search(state.movies, new URLSearchParams()) }),
  );
  await page.route('**/api/movies/*', (route) => {
    const id = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop()!);
    const movie = state.movies.find((item) => item.id === id);
    return movie
      ? route.fulfill({ json: movie })
      : route.fulfill({ status: 404, json: { error: 'not_found' } });
  });
  await page.route('**/api/movies/*/playback*', (route) => {
    const id = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-2)!);
    const movie = state.movies.find((item) => item.id === id);
    if (!movie) return route.fulfill({ status: 404, json: { error: 'not_found' } });
    if (movie.releasedOn > TODAY) return route.fulfill({ status: 409, json: { error: 'not_released' } });
    if (!state.user) return route.fulfill({ status: 401, json: { error: 'login_required' } });
    if (!state.subscription) return route.fulfill({ status: 403, json: { error: 'plan_required' } });
    if (movie.firstImport && state.subscription.plan === 'basic')
      return route.fulfill({ status: 403, json: { error: 'upgrade_required' } });
    const quality = { basic: 'HD', standard: 'FHD', premium: '4K' }[state.subscription.plan];
    if (route.request().method() === 'DELETE') return route.fulfill({ status: 204 });
    if (route.request().method() === 'PUT') {
      return state.screensFull
        ? route.fulfill({ status: 409, json: { error: 'too_many_screens' } })
        : route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: { quality, positionSeconds: state.progress[id] ?? 0 } });
  });

  await page.route('**/api/account', (route) => {
    if (!state.user) return route.fulfill({ status: 401, json: { error: 'unauthorized' } });
    state.user = null;
    state.subscription = null;
    state.payments = [];
    state.watchlist = [];
    state.progress = {};
    state.alerts = [];
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/library', (route) => {
    if (!state.user) return route.fulfill({ status: 401, json: { error: 'unauthorized' } });
    const byId = (id: string) => state.movies.find((movie) => movie.id === id);
    return route.fulfill({
      json: {
        watchlist: state.watchlist.flatMap((id) => byId(id) ?? []),
        continueWatching: Object.entries(state.progress).flatMap(([id, positionSeconds]) => {
          const movie = byId(id);
          return movie ? [{ movie, positionSeconds }] : [];
        }),
        alerts: state.alerts.flatMap((id) => {
          const movie = byId(id);
          return movie
            ? [{ movie, unread: movie.releasedOn <= TODAY && !state.alertsRead.includes(id) }]
            : [];
        }),
      },
    });
  });
  await page.route('**/api/library/*/*', (route) => {
    if (!state.user) return route.fulfill({ status: 401, json: { error: 'unauthorized' } });
    const [kind, id] = new URL(route.request().url()).pathname.split('/').slice(-2);
    const method = route.request().method();
    if (kind === 'alerts') state.alertsRead = [...state.alerts];
    else if (kind === 'alert') {
      state.alerts = method === 'PUT' ? [...state.alerts, id] : state.alerts.filter((item) => item !== id);
    } else if (kind === 'progress' && method === 'DELETE') delete state.progress[id];
    else if (kind === 'progress') state.progress[id] = route.request().postDataJSON().positionSeconds;
    else if (method === 'PUT') state.watchlist = [id, ...state.watchlist.filter((item) => item !== id)];
    else state.watchlist = state.watchlist.filter((item) => item !== id);
    return route.fulfill({ status: 204 });
  });

  await page.route('**/api/subscription', async (route: Route) => {
    if (!state.user) return route.fulfill({ status: 401, json: { error: 'unauthorized' } });
    const method = route.request().method();
    if (method === 'GET') return route.fulfill({ json: subscriptionData() });
    const body = route.request().postDataJSON();
    if (method === 'POST') {
      state.posts += 1;
      if (state.delay) await new Promise((resolve) => setTimeout(resolve, state.delay));
      if (body.simulateFailure) {
        pay(body.plan, PRICES[body.plan], 'new', 'failed');
        return route.fulfill({ status: 402, json: { error: 'payment_failed' } });
      }
      if (state.subscription) return route.fulfill({ status: 409, json: { error: 'already_subscribed' } });
      state.subscription = subscriptionFor(body.plan);
      pay(body.plan, PRICES[body.plan], 'new');
      return route.fulfill({ status: 201, json: subscriptionData() });
    }
    if (!state.subscription) return route.fulfill({ status: 409, json: { error: 'no_subscription' } });
    if (body.action === 'cancel') state.subscription.cancelAtPeriodEnd = true;
    if (body.action === 'resume') state.subscription.cancelAtPeriodEnd = false;
    if (body.action === 'change') {
      const difference = PRICES[body.plan] - PRICES[state.subscription.plan];
      if (difference > 0) {
        state.subscription.plan = body.plan;
        state.subscription.pendingPlan = null;
        pay(body.plan, difference, 'upgrade');
      } else if (difference < 0) {
        state.subscription.pendingPlan = body.plan;
      } else {
        state.subscription.pendingPlan = null;
      }
    }
    return route.fulfill({ json: subscriptionData() });
  });

  let pendingUser: FakeUser | null = null;

  // Identity: 기본은 가입하면 바로 확인되는 사이트로 흉내 냅니다.
  await page.route('**/.netlify/identity/**', async (route) => {
    const url = new URL(route.request().url());
    const json = {
      id: 'u-new',
      email: 'cinephile@example.com',
      confirmed_at: NOW.toISOString(),
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: '새 시네필' },
    };
    if (url.pathname.endsWith('/signup') || url.pathname.endsWith('/user')) {
      if (url.pathname.endsWith('/signup')) {
        if (requireEmailConfirmation) {
          pendingUser = { id: json.id, email: json.email, name: '새 시네필' };
          const { confirmed_at: _confirmedAt, ...unconfirmed } = json;
          return route.fulfill({ json: unconfirmed });
        }
        state.user = { id: json.id, email: json.email, name: '새 시네필' };
      }
      return route.fulfill({ json });
    }
    if (url.pathname.endsWith('/token') || url.pathname.endsWith('/verify')) {
      // 메일 링크로 들어오면 가입을 기다리던 사람이 로그인됩니다.
      state.user = (url.pathname.endsWith('/verify') ? pendingUser : null) ?? state.user ?? MEMBER;
      const payload = Buffer.from(JSON.stringify({ exp: 4102444800, sub: json.id })).toString('base64url');
      return route.fulfill({
        json: {
          access_token: `e30.${payload}.sig`,
          refresh_token: 'refresh',
          token_type: 'bearer',
          expires_in: 3600,
        },
      });
    }
    if (url.pathname.endsWith('/logout')) {
      state.user = null;
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: {} });
  });

  return state;
}
