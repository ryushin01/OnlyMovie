import type { ZodMiniType } from 'zod/mini';

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`API 요청 실패: ${status}`);
  }
}

/** 응답은 왔지만 약속한 모양이 아닐 때. 서버 오류처럼(502) 다뤄 한 번 다시 시도합니다. */
export class InvalidResponseError extends ApiError {
  constructor(readonly path: string) {
    super(502);
    this.message = `API 응답 형식이 다릅니다: ${path}`;
  }
}

async function send(path: string, init?: RequestInit) {
  const response = await fetch(path, init);
  if (!response.ok) throw new ApiError(response.status);
  return response;
}

/** 내용을 쓰지 않는 요청(저장·삭제 등). 2xx가 아니면 ApiError를 던집니다. */
export async function request(path: string, init?: RequestInit): Promise<void> {
  await send(path, init);
}

/**
 * JSON을 받아 스키마로 확인합니다. 2xx가 아니면 ApiError, 모양이 다르면 InvalidResponseError를 던집니다.
 * 화면이 깨지는 대신 오류 화면과 다시 시도로 이어집니다.
 */
export async function requestJson<T>(path: string, schema: ZodMiniType<T>, init?: RequestInit): Promise<T> {
  const response = await send(path, init);
  const result = schema.safeParse(await response.json().catch(() => undefined));
  if (!result.success) throw new InvalidResponseError(path);
  return result.data;
}
