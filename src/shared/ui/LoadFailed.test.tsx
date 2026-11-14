import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadFailed } from './LoadFailed';
import { PageAnnouncer } from './PageAnnouncer';

function Harness({ failed }: { failed: boolean }) {
  return (
    <>
      {failed && <LoadFailed title="영화를 불러오지 못했습니다" />}
      <PageAnnouncer />
    </>
  );
}

describe('LoadFailed', () => {
  it('쪽 제목(h1)을 갖추고, 레이아웃의 알림 영역으로 새로고침 안내를 알린다', () => {
    const { rerender } = render(<Harness failed={false} />);
    const region = screen.getByRole('alert');

    rerender(<Harness failed />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('영화를 불러오지 못했습니다');
    expect(region).toHaveTextContent('영화를 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.');

    rerender(<Harness failed={false} />);
    expect(region).toBeEmptyDOMElement();
  });
});
