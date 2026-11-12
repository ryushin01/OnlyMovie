import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod/mini';
import { ApiError, requestJson } from '@/shared/api/request';

const KEY = ['session'];

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

const MeSchema: z.ZodMiniType<{ user: SessionUser | null }> = z.object({
  user: z.nullable(z.object({ id: z.string(), email: z.string(), name: z.nullable(z.string()) })),
});

/**
 * 로그인 상태를 읽습니다. 메뉴와 안내에만 쓰고, 실제 권한은 서버가 요청마다 확인합니다.
 * 함수가 깨어나는 중의 일시적인 실패는 다시 시도하도록, 4xx 응답만 비로그인으로 저장합니다.
 */
export function useSession() {
  const { data, isPending } = useQuery({
    queryKey: KEY,
    queryFn: () =>
      requestJson('/api/me', MeSchema).catch((error: unknown) => {
        if (error instanceof ApiError && error.status < 500) return { user: null };
        throw error;
      }),
    staleTime: 5 * 60 * 1000,
  });
  return { user: data?.user ?? null, isPending };
}

export function useRefreshSession() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: KEY });
}

/** 로그아웃이 끝난 뒤 회원 메뉴를 바로 닫습니다. 다시 조회하면 그 요청이 실패할 때 이전 상태가 남습니다. */
export function useClearSession() {
  const client = useQueryClient();
  return async () => {
    await client.cancelQueries({ queryKey: KEY });
    client.setQueryData(KEY, { user: null });
  };
}
