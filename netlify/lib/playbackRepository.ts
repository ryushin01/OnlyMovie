import type { Queryable } from './db';

/** 재생 중인 기기는 30초마다 갱신합니다. 한 번 놓쳐도 끊기지 않고, 창을 닫은 기기는 곧 빠지는 길이입니다. */
export const SCREEN_TTL_SECONDS = 70;

/**
 * 이 기기의 재생 자리를 잡거나 갱신합니다. 이미 재생 중인 기기는 대수와 상관없이 이어 갑니다.
 * 새 기기는 살아 있는 다른 기기 수가 한도보다 적을 때만 자리를 얻습니다.
 * 두 기기가 같은 순간에 시작하면 한도를 잠시 넘을 수 있지만, 실제 영상이 없는 프로젝트라 잠금을 두지 않습니다.
 */
export async function claimScreen(
  db: Queryable,
  {
    userId,
    deviceId,
    movieId,
    limit,
    now,
  }: {
    userId: string;
    deviceId: string;
    movieId: string;
    limit: number;
    now: Date;
  },
): Promise<boolean> {
  const cutoff = new Date(now.getTime() - SCREEN_TTL_SECONDS * 1000);
  const { rows: live } = await db.query(
    `UPDATE playback_sessions SET movie_id = $3, last_seen_at = $4
     WHERE user_id = $1 AND device_id = $2 AND last_seen_at > $5 RETURNING 1`,
    [userId, deviceId, movieId, now, cutoff],
  );
  if (live.length > 0) return true;

  await db.query('DELETE FROM playback_sessions WHERE user_id = $1 AND last_seen_at <= $2', [userId, cutoff]);
  const { rows } = await db.query(
    `INSERT INTO playback_sessions (user_id, device_id, movie_id, last_seen_at)
     SELECT $1::text, $2::text, $3::text, $4::timestamptz
     WHERE (SELECT count(*) FROM playback_sessions WHERE user_id = $1::text AND device_id <> $2::text) < $5::int
     ON CONFLICT (user_id, device_id) DO UPDATE SET movie_id = EXCLUDED.movie_id, last_seen_at = EXCLUDED.last_seen_at
     RETURNING 1`,
    [userId, deviceId, movieId, now, limit],
  );
  return rows.length > 0;
}

export async function releaseScreen(db: Queryable, userId: string, deviceId: string): Promise<void> {
  await db.query('DELETE FROM playback_sessions WHERE user_id = $1 AND device_id = $2', [userId, deviceId]);
}
