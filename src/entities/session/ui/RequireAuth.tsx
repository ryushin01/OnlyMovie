import type { ReactNode } from 'react';
import { Navigate, useRouterState } from '@tanstack/react-router';
import { routes } from '@/shared/config';
import { useSession } from '../api/useSession';

/** 회원 화면을 감쌉니다. 로그인하지 않았으면 로그인 뒤 돌아오도록 로그인 화면으로 보냅니다. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isPending } = useSession();
  // 이동하는 중에는 location이 갈 곳을 가리킵니다. 돌아올 주소는 지금 그려진 화면의 주소로 잡습니다.
  const here = useRouterState({ select: (state) => (state.resolvedLocation ?? state.location).href });
  if (isPending) return <output css={{ display: 'block', paddingTop: 32 }}>확인하는 중입니다.</output>;
  return user ? children : <Navigate {...routes.login(here)} replace />;
}
