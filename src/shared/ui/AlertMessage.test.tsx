import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { AlertMessage } from './AlertMessage';

it('오류가 없어도 빈 알림 영역을 미리 두고, 같은 영역의 내용만 바꾼다', () => {
  const { rerender } = render(<AlertMessage>{null}</AlertMessage>);
  const alert = screen.getByRole('alert');
  expect(alert).toBeEmptyDOMElement();

  rerender(<AlertMessage>저장하지 못했습니다. 다시 시도해 주세요.</AlertMessage>);
  expect(screen.getByRole('alert')).toBe(alert);
  expect(alert).toHaveTextContent('저장하지 못했습니다.');
});
