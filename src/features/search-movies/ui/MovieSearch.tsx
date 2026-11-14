import { css } from '@emotion/react';
import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { routes } from '@/shared/config/routes';
import { SearchIcon } from '@/shared/ui/icons';
import { inputCss, visuallyHidden } from '@/shared/ui/styles';
import { Tooltip } from '@/shared/ui/Tooltip';

const searchCss = css`
  width: 100%;
  max-width: 520px;
`;
const formCss = css`
  position: relative;
`;
const fieldCss = css`
  padding-left: 52px;
  border-radius: 999px;
`;
const submitWrapCss = css`
  position: absolute;
  top: 2px;
  left: 4px;
`;
const submitCss = css`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--accent);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
`;

/** 머리글의 검색창. 어느 화면에서든 제목, 감독, 배우로 찾아 리스트로 갑니다. */
export function MovieSearch() {
  const id = useId();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate(routes.movies(q.trim() ? { q: q.trim() } : {}));
  };

  return (
    <search css={searchCss}>
      <form css={formCss} onSubmit={handleSubmit}>
        <label htmlFor={id} css={visuallyHidden}>
          영화 검색
        </label>
        <input
          id={id}
          css={[inputCss, fieldCss]}
          type="search"
          placeholder="제목, 감독, 배우"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Tooltip label="검색" css={submitWrapCss}>
          {(trigger) => (
            <button type="submit" css={submitCss} {...trigger}>
              <SearchIcon />
            </button>
          )}
        </Tooltip>
      </form>
    </search>
  );
}
