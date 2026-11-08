import { getRouteApi, Link, useNavigate } from '@tanstack/react-router';
import { LoginForm } from '@/features/login';
import { routes, safeNext } from '@/shared/config/routes';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';
import { formPanelCss, formTitleCss } from '@/shared/ui/styles';

const route = getRouteApi('/login');

export function LoginPage() {
  useDocumentTitle('로그인');
  const navigate = useNavigate();
  const { next } = route.useSearch();

  return (
    <div css={formPanelCss}>
      <h1 css={formTitleCss}>로그인</h1>
      <LoginForm onDone={() => navigate({ href: safeNext(next), replace: true })} />
      <p css={{ margin: '32px 0 0' }}>
        아직 회원이 아니신가요? <Link {...routes.signup(next)}>회원가입</Link>
      </p>
    </div>
  );
}
