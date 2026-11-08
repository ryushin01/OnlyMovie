import { getDatabase } from '@netlify/database';
import type { Config, Context } from '@netlify/functions';
import { isReleased } from '../../src/entities/movie/model/types';
import { activePlan, PLANS, watchBlock } from '../../src/entities/subscription/model/plans';
import { currentMember, rejectCrossSite, unauthorized } from '../lib/auth';
import { getProgress } from '../lib/libraryRepository';
import { findMovie } from '../lib/movieRepository';
import { claimScreen, releaseScreen } from '../lib/playbackRepository';
import { getSubscription } from '../lib/subscriptionRepository';

const STATUS = { login_required: 401, plan_required: 403, upgrade_required: 403, not_released: 409 };
const DEVICE_ID = /^[\w-]{8,64}$/;

/**
 * 재생 권한을 서버에서 확인합니다. 실제 영상은 없으므로 권한과 화질만 돌려줍니다.
 * PUT은 재생 중인 기기의 자리를 잡거나 갱신하고, DELETE는 자리를 돌려줍니다. 이용권의 동시 시청 대수를 여기서 지킵니다.
 */
export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    const rejected = rejectCrossSite(req, context);
    if (rejected) return rejected;
  }
  const db = getDatabase().pool;
  const now = new Date();
  const deviceId = new URL(req.url).searchParams.get('device') ?? '';
  const invalidDevice = () => Response.json({ error: 'invalid' }, { status: 400 });

  if (req.method === 'DELETE') {
    const member = await currentMember(context);
    if (!member) return unauthorized();
    if (!DEVICE_ID.test(deviceId)) return invalidDevice();
    await releaseScreen(db, member.id, deviceId);
    return new Response(null, { status: 204 });
  }
  if (req.method !== 'GET' && req.method !== 'PUT')
    return new Response('Method not allowed', { status: 405 });

  const movie = await findMovie(db, context.params.id);
  if (!movie) return Response.json({ error: 'not_found' }, { status: 404 });

  const member = await currentMember(context);
  const plan = member ? activePlan(await getSubscription(db, member.id, now)) : null;
  const block = watchBlock(
    { firstImport: movie.firstImport, released: isReleased(movie, now) },
    { loggedIn: Boolean(member), plan },
  );
  if (block) return Response.json({ error: block }, { status: STATUS[block] });

  if (req.method === 'PUT') {
    if (!DEVICE_ID.test(deviceId)) return invalidDevice();
    const claimed = await claimScreen(db, {
      userId: member!.id,
      deviceId,
      movieId: movie.id,
      limit: PLANS[plan!].screens,
      now,
    });
    return claimed
      ? new Response(null, { status: 204 })
      : Response.json({ error: 'too_many_screens' }, { status: 409 });
  }
  return Response.json(
    { quality: PLANS[plan!].quality, positionSeconds: await getProgress(db, member!.id, movie.id) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};

export const config: Config = { path: '/api/movies/:id/playback' };
