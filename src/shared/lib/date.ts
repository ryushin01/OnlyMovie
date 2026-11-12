/** 날짜는 한국 시간으로 보여 줍니다. 포맷 객체는 한 번만 만들어 다시 씁니다. */
const FORMATS = {
  long: new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long', timeZone: 'Asia/Seoul' }),
  medium: new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone: 'Asia/Seoul' }),
};

/**
 * '2026-11-13T03:00:00Z' → long: "2026년 11월 13일", medium: "2026. 11. 13."
 * 날짜가 아니면 "—". `Intl.DateTimeFormat.format`은 잘못된 날짜에 RangeError를 던져 화면이 깨지기 때문입니다.
 */
export function formatKoreanDate(iso: string, style: keyof typeof FORMATS = 'long') {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : FORMATS[style].format(date);
}
