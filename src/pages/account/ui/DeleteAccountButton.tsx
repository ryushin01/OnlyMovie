import { useRef, useState } from 'react';
import { useClearSession } from '@/entities/session';
import { request } from '@/shared/api';
import { AlertMessage } from '@/shared/ui/AlertMessage';
import { Button } from '@/shared/ui/Button';

const MESSAGE =
  '계정과 이용권, 결제 내역, 찜 목록, 이어 보기 기록을 모두 지웁니다. 되돌릴 수 없습니다. 탈퇴할까요?';

export function DeleteAccountButton({ onDone }: { onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const submitting = useRef(false);
  const clearSession = useClearSession();

  const handleClick = async () => {
    // 빠르게 두 번 누르면 pending이 바뀌기 전에 다시 들어오므로 ref로 막습니다.
    if (submitting.current || !window.confirm(MESSAGE)) return;
    submitting.current = true;
    setPending(true);
    setFailed(false);
    try {
      await request('/api/account', { method: 'DELETE' });
    } catch {
      // 성공하면 화면을 떠나므로 실패했을 때만 다시 누를 수 있게 합니다.
      submitting.current = false;
      setFailed(true);
      setPending(false);
      return;
    }
    // 서버가 쿠키를 지웠습니다. 브라우저에 남은 상태도 치우되, 이미 없는 계정이라 실패할 수 있습니다.
    await import('@netlify/identity').then(({ logout }) => logout()).catch(() => {});
    // 세션을 먼저 비우면 회원 화면의 보호 장치가 로그인 화면으로 보내므로, 완료를 먼저 알립니다.
    onDone();
    await clearSession();
  };

  return (
    <>
      <Button variant="outline" pending={pending} onClick={handleClick}>
        {pending ? '탈퇴하는 중…' : '회원 탈퇴'}
      </Button>
      {/* 안내 영역은 처음부터 두고 내용만 바꿉니다. 초점은 버튼에 그대로 둡니다. */}
      <AlertMessage css={{ marginTop: 12, color: 'var(--danger)', fontWeight: 700 }}>
        {failed ? '탈퇴하지 못했습니다. 잠시 뒤 다시 시도해 주세요.' : null}
      </AlertMessage>
    </>
  );
}
