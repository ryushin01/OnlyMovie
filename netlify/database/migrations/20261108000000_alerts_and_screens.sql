-- 공개 예정작의 공개 알림 신청입니다. read_at은 공개된 뒤 회원이 알림을 확인한 시각입니다.
CREATE TABLE release_alerts (
  user_id TEXT NOT NULL,
  movie_id TEXT NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, movie_id)
);

-- 지금 재생 중인 기기입니다. 재생 중에 주기적으로 갱신하며, 갱신이 끊긴 기기는 시청 대수에서 빠집니다.
CREATE TABLE playback_sessions (
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  movie_id TEXT NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, device_id)
);
