import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod/mini';
import { ApiError, InvalidResponseError, request, requestJson } from './request';

const Schema = z.object({ id: z.string() });

describe('requestJson', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('스키마에 맞는 응답을 돌려줍니다', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json({ id: 'a' })));
    await expect(requestJson('/api/x', Schema)).resolves.toEqual({ id: 'a' });
  });

  it('모양이 다르거나 JSON이 아니면 InvalidResponseError(502)를 던져 다시 시도하게 합니다', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json({ id: 1 })));
    await expect(requestJson('/api/x', Schema)).rejects.toBeInstanceOf(InvalidResponseError);
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('<html>')));
    await expect(requestJson('/api/x', Schema)).rejects.toMatchObject({ status: 502 });
  });

  it('2xx가 아니면 상태 코드를 담은 ApiError를 던집니다', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 404 })));
    const error = await requestJson('/api/x', Schema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(InvalidResponseError);
    expect((error as ApiError).status).toBe(404);
  });
});

describe('request', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('내용 없는 응답(204)을 받고, 실패하면 ApiError를 던집니다', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 204 })));
    await expect(request('/api/x', { method: 'DELETE' })).resolves.toBeUndefined();
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 409 })));
    await expect(request('/api/x')).rejects.toMatchObject({ status: 409 });
  });
});
