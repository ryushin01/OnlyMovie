import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useAnnounce } from '@/shared/lib/announcer';
import { PageAnnouncer } from './PageAnnouncer';

function Message({ text }: { text: string }) {
  useAnnounce(text);
  return null;
}

function Harness({ text }: { text?: string }) {
  return (
    <>
      {text && <Message text={text} />}
      <PageAnnouncer />
    </>
  );
}

it('처음부터 있는 알림 영역에 안내를 넣고, 안내한 화면이 사라지면 지운다', () => {
  const { rerender } = render(<Harness />);
  const region = screen.getByRole('alert');
  expect(region).toBeEmptyDOMElement();

  rerender(<Harness text="영화를 불러오지 못했습니다." />);
  expect(screen.getByRole('alert')).toBe(region);
  expect(region).toHaveTextContent('영화를 불러오지 못했습니다.');

  rerender(<Harness />);
  expect(region).toBeEmptyDOMElement();
});
