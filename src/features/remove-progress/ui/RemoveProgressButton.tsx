import { css } from '@emotion/react';
import { useRef } from 'react';
import { useRemoveProgress } from '@/entities/movie';
import { CloseIcon } from '@/shared/ui/icons';
import { visuallyHidden } from '@/shared/ui/styles';

const buttonCss = css`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: #fff;
  background: rgb(31 34 48 / 0.82);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  --focus: #fff;
`;
const errorCss = css`
  position: absolute;
  top: 40px;
  right: 0;
  width: max-content;
  max-width: 180px;
  margin: 0;
  padding: 4px 8px;
  color: #fff;
  background: rgb(31 34 48 / 0.92);
  border-radius: 8px;
  font-size: 0.8125rem;
`;

/** 이어 보기에서 작품을 지웁니다. 버튼이 사라지므로 초점은 본문으로 옮깁니다. */
export function RemoveProgressButton({ movieId, title }: { movieId: string; title: string }) {
  const remove = useRemoveProgress();
  const locked = useRef(false);

  const handleClick = () => {
    if (locked.current) return;
    locked.current = true;
    remove.mutate(movieId, {
      onSuccess: () => document.getElementById('main')?.focus({ preventScroll: true }),
      // 성공하면 버튼이 사라지므로 실패했을 때만 다시 누를 수 있게 합니다.
      onError: () => {
        locked.current = false;
      },
    });
  };

  return (
    <>
      <button type="button" css={buttonCss} disabled={remove.isPending} onClick={handleClick}>
        <CloseIcon width={18} height={18} />
        <span css={visuallyHidden}>{title} 이어 보기에서 지우기</span>
      </button>
      {remove.isError && (
        <p role="alert" css={errorCss}>
          지우지 못했습니다. 다시 시도해 주세요.
        </p>
      )}
    </>
  );
}
