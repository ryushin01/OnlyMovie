import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadFailed } from './LoadFailed';

describe('LoadFailed', () => {
  it('쪽 제목(h1)과 새로고침 안내를 alert로 알립니다', () => {
    render(<LoadFailed title="영화를 불러오지 못했습니다" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('영화를 불러오지 못했습니다');
    expect(screen.getByRole('alert')).toHaveTextContent('새로고침해 주세요');
  });
});
