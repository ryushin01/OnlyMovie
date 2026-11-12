import { describe, expect, it } from 'vitest';
import { formatKoreanDate } from './date';

describe('formatKoreanDate', () => {
  it('한국 시간 날짜로 보여 줍니다 (UTC 자정 전후가 하루 밀리지 않게)', () => {
    expect(formatKoreanDate('2026-11-12T16:00:00Z')).toBe('2026년 11월 13일');
    expect(formatKoreanDate('2026-11-12T16:00:00Z', 'medium')).toBe('2026. 11. 13.');
  });
});
