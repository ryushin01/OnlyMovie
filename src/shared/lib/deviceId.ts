const STORAGE_KEY = 'only-movie-device';
let memory = '';

const create = () => crypto.randomUUID();

/** 이 브라우저를 가리키는 값입니다. 저장할 수 없는 환경이면 이번 방문 동안만 씁니다. */
export function deviceId(): string {
  if (memory) return memory;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    memory = saved ?? create();
    if (!saved) localStorage.setItem(STORAGE_KEY, memory);
  } catch {
    memory ||= create();
  }
  return memory;
}
