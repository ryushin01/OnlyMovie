import { css } from '@emotion/react';
import { useEffect, useRef, useState } from 'react';
import {
  claimScreen,
  formatClock as clock,
  formatRuntime,
  releaseScreen,
  useSaveProgress,
  type Movie,
} from '@/entities/movie';
import { ApiError } from '@/shared/api';
import { deviceId } from '@/shared/lib/deviceId';
import { AlertMessage } from '@/shared/ui/AlertMessage';
import { Button } from '@/shared/ui/Button';

const screenCss = css`
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  max-height: 70vh;
  width: 100%;
  color: #fff;
  background: #000;
  border-radius: var(--radius);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.55;
  }
`;
const subtitleCss = css`
  position: absolute;
  right: 16px;
  bottom: 16px;
  left: 16px;
  margin: 0;
  text-align: center;
  font-size: clamp(0.875rem, 2vw, 1.5rem);
  font-weight: 700;
  text-shadow: 0 1px 4px #000;
`;
const qualityCss = css`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 2px 8px;
  background: rgb(0 0 0 / 0.8);
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 700;
`;
const controlsCss = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
`;
const seekCss = css`
  flex: 1 1 200px;
  min-width: 0;
  height: 44px;
  accent-color: var(--accent);
`;

const SAVE_INTERVAL_MS = 15_000;
const SCREEN_INTERVAL_MS = 30_000;

/**
 * 재생 화면입니다. 실제 영상은 없고 진행 시간만 흐릅니다. 보던 위치는 재생 중 주기적으로, 그리고 멈출 때 저장합니다.
 * 자동으로 시작하지 않으며, 표준 버튼과 슬라이더만 써서 키보드로 모두 조작할 수 있습니다.
 */
interface Props {
  movie: Movie;
  quality: string;
  /** 지난번에 보던 위치 (초) */
  startAt: number;
}

export function Player({ movie, quality, startAt }: Props) {
  const duration = movie.runtimeMinutes * 60;
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(startAt);
  const [muted, setMuted] = useState(false);
  const [subtitles, setSubtitles] = useState(true);
  const [blocked, setBlocked] = useState(false);

  // 끝까지 가면 재생이 멈춘 것으로 봅니다.
  const running = playing && position < duration;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setPosition((current) => Math.min(current + 1, duration));
    }, 1000);
    return () => clearInterval(timer);
  }, [running, duration]);

  // 자리 요청은 앞의 요청이 끝난 뒤에 보냅니다. 늦게 도착한 요청이 이미 돌려준 자리를 다시 차지하지 않게 합니다.
  const screenQueue = useRef<Promise<unknown>>(Promise.resolve());

  // 재생하는 동안 이 기기의 자리를 지킵니다. 대수를 넘었을 때만 멈추고, 일시적인 네트워크 오류로는 끊지 않습니다.
  useEffect(() => {
    if (!running) return;
    const device = deviceId();
    const session = { active: true };
    const enqueue = (task: () => Promise<void>) => {
      screenQueue.current = screenQueue.current.then(task);
    };
    const claim = () =>
      enqueue(() =>
        claimScreen(movie.id, device).catch((error: unknown) => {
          if (session.active && error instanceof ApiError && error.status === 409) {
            setPlaying(false);
            setBlocked(true);
          }
        }),
      );
    claim();
    const timer = setInterval(claim, SCREEN_INTERVAL_MS);
    return () => {
      session.active = false;
      clearInterval(timer);
      enqueue(() => releaseScreen(movie.id, device).catch(() => {}));
    };
  }, [running, movie.id]);

  const { mutate: save } = useSaveProgress();
  const latest = useRef({ position, save });
  useEffect(() => {
    latest.current = { position, save };
  });

  // 재생 중에는 주기적으로 저장하고, 일시정지나 화면 이탈로 멈추면 그때 한 번 더 저장합니다.
  useEffect(() => {
    if (!running) return;
    const persist = () => {
      const { position: seconds, save: send } = latest.current;
      if (seconds > 0) send({ id: movie.id, positionSeconds: seconds });
    };
    const timer = setInterval(persist, SAVE_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      persist();
    };
  }, [running, movie.id]);

  const toggle = () => {
    // 끝까지 본 뒤에 누르면 처음부터 다시 봅니다.
    if (position >= duration) setPosition(0);
    setBlocked(false);
    setPlaying(!running);
  };

  return (
    <section aria-label="재생 화면">
      <div css={screenCss}>
        <img src={movie.backdrop} alt="" />
        <span css={qualityCss}>{quality}</span>
        {subtitles && <p css={subtitleCss}>[가상 자막] 실제 영상은 재생되지 않습니다.</p>}
      </div>
      <div css={controlsCss}>
        <Button onClick={toggle}>{running ? '일시정지' : '재생'}</Button>
        <input
          css={seekCss}
          type="range"
          aria-label="재생 위치"
          aria-valuetext={`${clock(position)} / ${clock(duration)}`}
          min={0}
          max={duration}
          step={10}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
        />
        <span>
          {clock(position)} / {clock(duration)}
        </span>
        <Button variant="outline" aria-pressed={muted} onClick={() => setMuted(!muted)}>
          음소거
        </Button>
        <Button variant="outline" aria-pressed={subtitles} onClick={() => setSubtitles(!subtitles)}>
          자막
        </Button>
      </div>
      <AlertMessage css={{ marginTop: 12, color: 'var(--danger)', fontWeight: 700 }}>
        {blocked
          ? '이용권의 동시 시청 대수를 모두 쓰고 있습니다. 다른 기기에서 재생을 멈춘 뒤 다시 눌러 주세요.'
          : null}
      </AlertMessage>
      <p css={{ margin: '12px 0 0', color: 'var(--muted)' }}>
        {movie.audioLanguages.join(', ')} 음성 · {movie.subtitleLanguages.join(', ')} 자막 ·{' '}
        {formatRuntime(movie.runtimeMinutes)}
      </p>
    </section>
  );
}
