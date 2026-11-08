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

const MIN_PASSWORD = 8;

interface Errors {
  name?: string;
  email?: string;
  password?: string;
}

function validate(name: string, email: string, password: string): Errors {
  const errors: Errors = {};
  if (!name.trim()) errors.name = '이름을 입력해 주세요.';
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) errors.email = '이메일 형식으로 입력해 주세요. 예: name@example.com';
  if (password.length < MIN_PASSWORD) errors.password = `비밀번호를 ${MIN_PASSWORD}자 이상 입력해 주세요.`;
  return errors;
}

export function SignupForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [pending, setPending] = useState(false);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const refreshSession = useRefreshSession();

  useEffect(() => {
    if (failure) alertRef.current?.focus();
  }, [failure]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const found = validate(name, email, password);
    setErrors(found);
    setFailure('');
    if (Object.keys(found).length > 0) {
      // 오류가 난 첫 입력 칸으로 초점을 옮깁니다.
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setPending(true);
    try {
      const { signup } = await import('@netlify/identity');
      const user = await signup(email, password, { full_name: name.trim() });
      // 자동 확인을 켠 사이트는 바로 로그인되고, 아니면 메일의 링크를 눌러야 합니다.
      if (user.confirmedAt) {
        await refreshSession();
        onDone();
      } else {
        setSentTo(email);
      }
    } catch {
      setFailure('가입하지 못했습니다. 이미 가입한 이메일인지 확인하고 다시 시도해 주세요.');
    } finally {
      setPending(false);
    }
  };

  if (sentTo) {
    return (
      <output>
        {sentTo}로 확인 메일을 보냈습니다. 메일의 링크를 누르면 가입이 끝납니다. 메일이 보이지 않으면 스팸함을
        확인해 주세요.
      </output>
    );
  }

  return (
    <form ref={formRef} css={formCss} onSubmit={handleSubmit} noValidate>
      <Field label="이름" required error={errors.name}>
        {(control) => (
          <input
            {...control}
            css={inputCss}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
      </Field>
      <Field label="이메일" required error={errors.email}>
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
      <Field label="비밀번호" required hint={`${MIN_PASSWORD}자 이상`} error={errors.password}>
        {(control) => (
          <input
            {...control}
            css={inputCss}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
      </Field>
      {failure && (
        <p ref={alertRef} role="alert" tabIndex={-1} css={alertCss}>
          {failure}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? '가입 중…' : '가입하기'}
        </Button>
      </div>
    </form>
  );
}
