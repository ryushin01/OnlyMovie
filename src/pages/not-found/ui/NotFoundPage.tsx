import { Link } from '@tanstack/react-router';
import { routes } from '@/shared/config';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';
import { buttonCss } from '@/shared/ui/Button';
import { PageMessage } from '@/shared/ui/PageMessage';

export function NotFoundPage() {
  useDocumentTitle('페이지를 찾을 수 없습니다');
  return (
    <PageMessage title="페이지를 찾을 수 없습니다">
      <Link {...routes.home} css={buttonCss()}>
        메인으로
      </Link>
    </PageMessage>
  );
}
