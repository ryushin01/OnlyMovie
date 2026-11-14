import { useState } from 'react';
import { useClearSession, useRefreshSession } from '@/entities/session';
import { Button } from '@/shared/ui/Button';

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const clearSession = useClearSession();
  const refreshSession = useRefreshSession();

  const handleClick = async () => {
    setPending(true);
    try {
      const { logout } = await import('@netlify/identity');
      await logout();
      await clearSession();
    } catch {
      // 로그아웃에 실패하면 서버가 아는 상태를 다시 읽어 화면에 맞춥니다.
      await refreshSession();
    } finally {
      setPending(false);
    }
  };

  return (
    <Button variant="outline" pending={pending} onClick={handleClick}>
      로그아웃
    </Button>
  );
}
