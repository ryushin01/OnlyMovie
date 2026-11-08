import { css } from '@emotion/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRefreshSession } from '@/entities/session';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { inputCss } from '@/shared/ui/styles';

const formCss = css`
  display: grid;
  gap: 24px;
  max-width: 420px;
`;
const alertCss = css`
  margin: 0;
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
  const alertRef = useRef<HTMLParagraphElement>(null);
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
        if (active) setError('링크가 만료되었거나 올바르지 않습니다.');
      });
    return () => {
      active = false;
    };
    // 주소의 토큰은 한 번만 처리합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) alertRef.current?.focus();
  }, [error]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setError('');
    setNotice('');
    setPending(true);
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
      onDone();
    } catch {
      setError(
        mode === 'login'
          ? '이메일이나 비밀번호가 맞지 않습니다.'
          : '요청을 처리하지 못했습니다. 다시 시도해 주세요.',
      );
    } finally {
      setPending(false);
    }
  };

  const submitLabel = { login: '로그인', forgot: '재설정 메일 받기', recovery: '비밀번호 설정' }[mode];

  return (
    <form css={formCss} onSubmit={handleSubmit}>
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
      {error && (
        <p ref={alertRef} role="alert" tabIndex={-1} css={alertCss}>
          {error}
        </p>
      )}
      <output css={{ display: 'block' }}>{notice}</output>
      <div css={actionsCss}>
        <Button type="submit" disabled={pending}>
          {pending ? '확인 중…' : submitLabel}
        </Button>
        {mode === 'login' && (
          <Button variant="outline" onClick={() => setMode('forgot')}>
            비밀번호 찾기
          </Button>
        )}
        {mode === 'forgot' && (
          <Button variant="outline" onClick={() => setMode('login')}>
            로그인으로 돌아가기
          </Button>
        )}
      </div>
    </form>
  );
}
