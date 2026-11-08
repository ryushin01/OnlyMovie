import { getDatabase } from '@netlify/database';
import type { Config, Context } from '@netlify/functions';
import { currentMember, rejectCrossSite, unauthorized } from '../lib/auth';
import {
  addReleaseAlert,
  addToWatchlist,
  getLibrary,
  markAlertsRead,
  removeFromWatchlist,
  removeProgress,
  removeReleaseAlert,
  saveProgress,
} from '../lib/libraryRepository';

const notFound = () => Response.json({ error: 'not_found' }, { status: 404 });
const MAX_POSITION = 24 * 60 * 60;

/** 회원의 찜 목록과 보던 영화입니다. 경로의 회원 ID를 받지 않고 항상 로그인한 회원의 기록만 다룹니다. */
export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    const rejected = rejectCrossSite(req, context);
    if (rejected) return rejected;
  }
  const member = await currentMember(context);
  if (!member) return unauthorized();

  const db = getDatabase().pool;
  const { kind, id } = context.params;

  if (!kind && req.method === 'GET') {
    return Response.json(await getLibrary(db, member.id), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (kind === 'watchlist' && id) {
    if (req.method === 'PUT') {
      return (await addToWatchlist(db, member.id, id)) ? new Response(null, { status: 204 }) : notFound();
    }
    if (req.method === 'DELETE') {
      await removeFromWatchlist(db, member.id, id);
      return new Response(null, { status: 204 });
    }
  }

  if (kind === 'alert' && id) {
    if (req.method === 'PUT') {
      const result = await addReleaseAlert(db, member.id, id, new Date());
      if (result === 'not_found') return notFound();
      if (result === 'released') return Response.json({ error: 'released' }, { status: 409 });
      return new Response(null, { status: 204 });
    }
    if (req.method === 'DELETE') {
      await removeReleaseAlert(db, member.id, id);
      return new Response(null, { status: 204 });
    }
  }

  if (kind === 'alerts' && id === 'read' && req.method === 'PUT') {
    await markAlertsRead(db, member.id, new Date());
    return new Response(null, { status: 204 });
  }

  if (kind === 'progress' && id && req.method === 'DELETE') {
    await removeProgress(db, member.id, id);
    return new Response(null, { status: 204 });
  }

  if (kind === 'progress' && id && req.method === 'PUT') {
    const input = (await req.json().catch(() => null)) as { positionSeconds?: unknown } | null;
    const position = input?.positionSeconds;
    if (
      typeof position !== 'number' ||
      !Number.isInteger(position) ||
      position <= 0 ||
      position > MAX_POSITION
    ) {
      return Response.json({ error: 'invalid' }, { status: 400 });
    }
    return (await saveProgress(db, member.id, id, position))
      ? new Response(null, { status: 204 })
      : notFound();
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config: Config = { path: ['/api/library', '/api/library/:kind/:id'] };
