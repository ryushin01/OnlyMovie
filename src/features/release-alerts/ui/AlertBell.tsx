import { css } from '@emotion/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { formatDate, useLibrary, useMarkAlertsRead } from '@/entities/movie';
import { useSession } from '@/entities/session';
import { routes } from '@/shared/config/routes';
import { buttonCss } from '@/shared/ui/Button';
import { BellIcon } from '@/shared/ui/icons';
import { badgeCss, visuallyHidden } from '@/shared/ui/styles';

const wrapCss = css`
  position: relative;
`;
const triggerCss = css`
  ${buttonCss('outline')}
  position: relative;
  width: 44px;
  min-height: 44px;
  padding: 0;
`;
const countCss = css`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding-inline: 5px;
  color: var(--on-accent);
  background: var(--accent);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  line-height: 20px;
  text-align: center;
`;
const panelCss = css`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 25;
  width: min(340px, calc(100vw - 32px));
  max-height: 60vh;
  padding: 16px;
  overflow-y: auto;
  background: var(--rail);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);

  h2 {
    margin: 0 0 8px;
    font-size: 1rem;
    font-weight: 700;
  }
  p {
    margin: 0;
    color: var(--muted);
  }
`;
const listCss = css`
  margin: 0;
  padding: 0;
  list-style: none;

  a {
    display: block;
    padding: 10px 0;
    color: var(--ink);
    font-weight: 700;
  }
  small {
    display: block;
    color: var(--muted);
    font-size: 0.8125rem;
    font-weight: 400;
  }
`;
const newCss = css`
  ${badgeCss}
  margin-left: 8px;
`;

/** 공개 알림 목록을 여는 버튼입니다. 메뉴가 아니라 링크 목록을 펼치므로 `aria-expanded`만 씁니다. 닫을 때 새 알림을 확인한 것으로 표시합니다. */
export function AlertBell() {
  const { user } = useSession();
  const { data } = useLibrary(user?.id);
  const { mutate: markRead } = useMarkAlertsRead();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const alerts = data?.alerts ?? [];
  const unread = alerts.filter((alert) => alert.unread).length;

  const latest = useRef({ unread, markRead });
  useEffect(() => {
    latest.current = { unread, markRead };
  });
  const close = useCallback(() => {
    setOpen(false);
    if (latest.current.unread > 0) latest.current.markRead();
  }, []);

  useEffect(() => {
    if (!open) return;
    const isOutside = (event: Event) => !wrapRef.current?.contains(event.target as Node);
    const handleOutside = (event: Event) => {
      if (isOutside(event)) close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close();
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('focusin', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('focusin', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  if (!user) return null;

  return (
    <div ref={wrapRef} css={wrapCss}>
      <button
        ref={triggerRef}
        type="button"
        css={triggerCss}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <BellIcon />
        <span css={visuallyHidden}>공개 알림{unread > 0 ? ` 새 소식 ${unread}건` : ''}</span>
        {unread > 0 && (
          <span css={countCss} aria-hidden="true">
            {unread}
          </span>
        )}
      </button>
      <div id={panelId} css={panelCss} hidden={!open}>
        <h2>공개 알림</h2>
        {alerts.length === 0 ? (
          <p>공개 예정작에서 공개 알림을 신청해 보세요.</p>
        ) : (
          <ul css={listCss}>
            {alerts.map(({ movie, unread: fresh }) => (
              <li key={movie.id}>
                <Link {...routes.movie(movie.id)} onClick={close}>
                  {movie.title}
                  {fresh && <span css={newCss}>새 소식</span>}
                  <small>{fresh ? '지금 볼 수 있습니다' : `${formatDate(movie.releasedOn)} 공개`}</small>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
