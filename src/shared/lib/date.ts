/** 날짜는 한국 시간으로 보여 줍니다. 포맷 객체는 한 번만 만들어 다시 씁니다. */
const FORMATS = {
  long: new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long', timeZone: 'Asia/Seoul' }),
  medium: new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone: 'Asia/Seoul' }),
};

/** '2026-11-13T03:00:00Z' → long: "2026년 11월 13일", medium: "2026. 11. 13." */
export const formatKoreanDate = (iso: string, style: keyof typeof FORMATS = 'long') =>
  FORMATS[style].format(new Date(iso));
