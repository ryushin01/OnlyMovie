import { css } from '@emotion/react';
import type { ReactNode } from 'react';

const baseCss = css`
  margin: 0;

  /* 비어 있을 때는 자리를 차지하지 않게 하되, 접근성 트리에는 남겨 둡니다. */
  &:empty {
    margin: 0;
    padding: 0;
  }
`;

/**
 * 시간에 민감한 오류 안내(`role="alert"`). 스크린 리더는 처음부터 있던 영역의 내용이 바뀔 때 읽으므로,
 * 오류가 없을 때도 빈 채로 그려 두고 내용만 바꿉니다. 초점은 옮기지 않습니다.
 */
export function AlertMessage({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <p role="alert" className={className} css={baseCss}>
      {children}
    </p>
  );
}
