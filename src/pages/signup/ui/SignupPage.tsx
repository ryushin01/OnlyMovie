import { getRouteApi, Link, useNavigate } from '@tanstack/react-router';
import { SignupForm } from '@/features/signup';
import { routes, safeNext } from '@/shared/config/routes';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';
import { formPanelCss, formTitleCss } from '@/shared/ui/styles';

const route = getRouteApi('/signup');

export function SignupPage() {
  useDocumentTitle('회원가입');
  const navigate = useNavigate();
  const { next } = route.useSearch();

  return (
    <div css={formPanelCss}>
      <h1 css={formTitleCss}>회원가입</h1>
      <p css={{ margin: '0 0 32px', color: 'var(--muted)' }}>
        시네필을 위한 미수입 영화관에 오신 것을 환영합니다. 이메일은 로그인에만 쓰입니다.
      </p>
      <SignupForm onDone={() => navigate({ href: safeNext(next), replace: true })} />
      <p css={{ margin: '32px 0 0' }}>
        이미 회원이신가요? <Link {...routes.login(next)}>로그인</Link>
      </p>
    </div>
  );
}
