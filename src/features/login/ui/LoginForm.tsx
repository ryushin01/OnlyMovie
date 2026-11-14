import { css } from '@emotion/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRefreshSession } from '@/entities/session';
import { AlertMessage } from '@/shared/ui/AlertMessage';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { inputCss } from '@/shared/ui/styles';

const formCss = css`
  display: grid;
  gap: 24px;
  max-width: 420px;
`;
const alertCss = css`
  color: var(--danger);
  font-weight: 700;
`;
const actionsCss = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

// 로그인 화면에서만 쓰므로 방문자가 받는 파일에 포함하지 않습니다.
const identity = () => import('@netlify/identity');

/** 로그인, 비밀번호 재설정 메일 요청, 메일 링크로 들어온 뒤의 새 비밀번호 설정을 처리합니다. */
type Mode = 'login' | 'forgot' | 'recovery';

export function LoginForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const focusFirstField = useRef(false);
  const refreshSession = useRefreshSession();

  useEffect(() => {
    if (!/(recovery|confirmation|access)_token=/.test(window.location.hash)) return;
    let active = true;
    identity()
      .then(({ handleAuthCallback }) => handleAuthCallback())
      .then((result) => {
        if (!active) return;
        if (result?.type === 'recovery') setMode('recovery');
        else if (result) void refreshSession().then(onDone);
      })
      .catch(() => {
        if (active)
          setError(
            '링크가 만료되었거나 올바르지 않습니다. 로그인하거나 비밀번호 찾기로 새 링크를 받아 주세요.',
          );
      });
    return () => {
      active = false;
    };
    // 주소의 토큰은 한 번만 처리합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 단계를 바꾸면 누른 버튼이 사라지므로, 새 단계의 첫 입력 칸으로 초점을 옮깁니다.
  useEffect(() => {
    if (!focusFirstField.current) return;
    focusFirstField.current = false;
    formRef.current?.querySelector('input')?.focus();
  }, [mode]);

  const switchMode = (next: Mode) => {
    focusFirstField.current = true;
    setError('');
    setNotice('');
    setMode(next);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // 빠르게 두 번 제출하면 pending이 바뀌기 전에 다시 들어오므로 ref로 막습니다.
    if (submitting.current) return;
    submitting.current = true;
    setError('');
    setNotice('');
    setPending(true);
    let leaving = false;
    try {
      const auth = await identity();
      if (mode === 'forgot') {
        await auth.requestPasswordRecovery(email);
        setNotice('가입한 이메일이면 비밀번호 재설정 메일이 도착합니다.');
        return;
      }
      if (mode === 'recovery') await auth.updateUser({ password });
      else await auth.login(email, password);
      await refreshSession();
      leaving = true;
      onDone();
    } catch {
      setError(
        mode === 'login'
          ? '이메일이나 비밀번호가 맞지 않습니다. 다시 입력하거나 비밀번호 찾기를 이용해 주세요.'
          : '요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
      );
    } finally {
      setPending(false);
      // 로그인을 마치면 화면을 떠나므로 잠금을 풀지 않습니다.
      if (!leaving) submitting.current = false;
    }
  };

  const submitLabel = { login: '로그인', forgot: '재설정 메일 받기', recovery: '비밀번호 설정' }[mode];

  return (
    <form ref={formRef} css={formCss} onSubmit={handleSubmit}>
      {mode !== 'recovery' && (
        <Field label="이메일" required>
          {(control) => (
            <input
              {...control}
              css={inputCss}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
      )}
      {mode !== 'forgot' && (
        <Field label={mode === 'login' ? '비밀번호' : '새 비밀번호'} required>
          {(control) => (
            <input
              {...control}
              css={inputCss}
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
      )}
      {/* 안내 영역은 처음부터 두고 내용만 바꿔야 스크린 리더가 읽습니다. 초점은 옮기지 않습니다. */}
      <div>
        <AlertMessage css={alertCss}>{error || null}</AlertMessage>
        <output css={{ display: 'block' }}>{notice}</output>
      </div>
      <div css={actionsCss}>
        <Button type="submit" pending={pending}>
          {pending ? '확인 중…' : submitLabel}
        </Button>
        {mode === 'login' && (
          <Button variant="outline" onClick={() => switchMode('forgot')}>
            비밀번호 찾기
          </Button>
        )}
        {mode === 'forgot' && (
          <Button variant="outline" onClick={() => switchMode('login')}>
            로그인으로 돌아가기
          </Button>
        )}
      </div>
    </form>
  );
}
