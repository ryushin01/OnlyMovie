import { vi } from 'vitest';

type Row = Record<string, unknown> & { id: string };

export const sampleMovie = (patch: Partial<Row> = {}): Row => ({
  id: 'last-screening',
  title: '마지막 상영',
  originalTitle: 'Ultima Proiecție',
  year: 2025,
  country: '루마니아',
  language: '루마니아어',
  genres: ['드라마'],
  director: '일리에 바르부',
  writer: '소린 마테이',
  cast: ['도이나 칼린', '미르체아 온치우'],
  runtimeMinutes: 112,
  ageRating: '12',
  advisories: ['주제'],
  moods: ['잔잔한'],
  audioLanguages: ['루마니아어'],
  subtitleLanguages: ['한국어', '영어'],
  synopsis: '문 닫는 동네 극장의 마지막 밤.',
  importNote: '영화제 상영에 그쳤던 작품을 들여왔습니다.',
  firstImport: true,
  releasedOn: '2026-10-30',
  poster: '/seed/a-poster.svg',
  backdrop: '/seed/a-backdrop.svg',
  ...patch,
});

const FACETS = {
  years: [2026, 2025],
  countries: ['루마니아', '칠레'],
  directors: ['일리에 바르부'],
  actors: ['도이나 칼린'],
  ageRatings: ['all', '12', '15'],
};

const PRICES: Record<string, number> = { basic: 7900, standard: 10900, premium: 13900 };

interface Options {
  movies?: Row[];
  user?: { id: string; email: string; name: string | null } | null;
  subscription?: Record<string, unknown> | null;
}

export const member = { id: 'u1', email: 'member@example.com', name: '시네필' };

export const activeSubscription = (plan: string) => ({
  plan,
  pendingPlan: null,
  status: 'active',
  cancelAtPeriodEnd: false,
  startedAt: '2026-11-06T00:00:00.000Z',
  currentPeriodEnd: '2026-12-06T00:00:00.000Z',
});

/** fetch를 메모리 안의 API로 바꿉니다. fail에 넣은 요청은 500으로 답합니다. */
export function installFakeApi({
  movies = [sampleMovie()],
  user = member,
  subscription = null,
}: Options = {}) {
  const state = {
    movies: [...movies],
    user,
    subscription,
    payments: [] as Record<string, unknown>[],
    watchlist: [] as string[],
    progress: {} as Record<string, number>,
    alerts: [] as string[],
    alertsRead: [] as string[],
    screensFull: false,
    calls: [] as { method: string; path: string; body?: unknown }[],
    fail: null as null | ((method: string, path: string) => boolean),
    hold: null as null | Promise<void>,
  };
  const subscriptionData = () => ({ subscription: state.subscription, payments: state.payments });

  vi.stubGlobal('fetch', async (input: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    state.calls.push({ method, path: input, body });
    await state.hold;
    if (state.fail?.(method, input)) return new Response(null, { status: 500 });

    const url = new URL(input, 'http://localhost');
    const path = url.pathname;

    if (path === '/api/me') return Response.json({ user: state.user });
    if (path === '/api/movie-facets') return Response.json(FACETS);
    if (path === '/api/account') {
      state.user = null;
      return new Response(null, { status: 204 });
    }
    if (path === '/api/library') {
      const byId = (id: string) => state.movies.find((movie) => movie.id === id);
      return Response.json({
        watchlist: state.watchlist.flatMap((id) => byId(id) ?? []),
        continueWatching: Object.entries(state.progress).flatMap(([id, positionSeconds]) => {
          const movie = byId(id);
          return movie ? [{ movie, positionSeconds }] : [];
        }),
        alerts: state.alerts.flatMap((id) => {
          const movie = byId(id);
          return movie ? [{ movie, unread: !state.alertsRead.includes(id) }] : [];
        }),
      });
    }
    if (path === '/api/library/alerts/read') {
      state.alertsRead = [...state.alerts];
      return new Response(null, { status: 204 });
    }
    const alert = path.match(/^\/api\/library\/alert\/(.+)$/);
    if (alert) {
      const id = decodeURIComponent(alert[1]);
      state.alerts = method === 'PUT' ? [...state.alerts, id] : state.alerts.filter((item) => item !== id);
      return new Response(null, { status: 204 });
    }
    const library = path.match(/^\/api\/library\/(watchlist|progress)\/(.+)$/);
    if (library) {
      const id = decodeURIComponent(library[2]);
      if (library[1] === 'progress') {
        if (method === 'DELETE') delete state.progress[id];
        else state.progress[id] = body.positionSeconds;
      } else if (method === 'PUT') state.watchlist.push(id);
      else state.watchlist = state.watchlist.filter((item) => item !== id);
      return new Response(null, { status: 204 });
    }
    if (path === '/api/home') {
      return Response.json({
        featured: state.movies[0] ?? null,
        rows: state.movies.length
          ? [{ title: '국내 첫 공개', query: 'firstImport=true&status=now', movies: state.movies }]
          : [],
      });
    }
    if (path === '/api/movies') {
      const q = url.searchParams.get('q');
      const genre = url.searchParams.get('genre');
      const items = state.movies.filter(
        (movie) =>
          (!q || String(movie.title).includes(q)) && (!genre || (movie.genres as string[]).includes(genre)),
      );
      return Response.json({ items, total: items.length, page: 1, pageSize: 24 });
    }
    if (path === '/api/subscription') {
      if (!state.user) return Response.json({ error: 'unauthorized' }, { status: 401 });
      if (method === 'POST') {
        if (body.simulateFailure) return Response.json({ error: 'payment_failed' }, { status: 402 });
        state.subscription = activeSubscription(body.plan);
        state.payments.unshift({
          id: 'p1',
          plan: body.plan,
          amount: PRICES[body.plan],
          kind: 'new',
          status: 'paid',
          createdAt: '2026-11-06T00:00:00.000Z',
        });
        return Response.json(subscriptionData(), { status: 201 });
      }
      if (method === 'PATCH') {
        if (body.action === 'cancel') state.subscription = { ...state.subscription, cancelAtPeriodEnd: true };
        if (body.action === 'resume')
          state.subscription = { ...state.subscription, cancelAtPeriodEnd: false };
        if (body.action === 'change') state.subscription = { ...state.subscription, plan: body.plan };
      }
      return Response.json(subscriptionData());
    }

    const playback = path.match(/^\/api\/movies\/([^/]+)\/playback$/);
    if (playback) {
      if (method === 'DELETE') return new Response(null, { status: 204 });
      if (method === 'PUT') {
        return state.screensFull
          ? Response.json({ error: 'too_many_screens' }, { status: 409 })
          : new Response(null, { status: 204 });
      }
      const movie = state.movies.find((row) => row.id === decodeURIComponent(playback[1]));
      if (!movie) return Response.json({ error: 'not_found' }, { status: 404 });
      if (!state.user) return Response.json({ error: 'login_required' }, { status: 401 });
      if (!state.subscription) return Response.json({ error: 'plan_required' }, { status: 403 });
      return Response.json({ quality: 'FHD', positionSeconds: state.progress[movie.id] ?? 0 });
    }

    const id = decodeURIComponent(path.replace('/api/movies/', ''));
    const found = state.movies.find((movie) => movie.id === id);
    return found ? Response.json(found) : Response.json({ error: 'not_found' }, { status: 404 });
  });

  return { state };
}
