import { useAnnounce } from '@/shared/lib/announcer';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';
import { Button } from '@/shared/ui/Button';
import { PageMessage } from '@/shared/ui/PageMessage';

/** 화면을 그리다 예상하지 못한 오류가 났을 때 라우터의 영문 기본 화면 대신 보여 줍니다. */
export function RouteErrorPage() {
  useDocumentTitle('화면을 표시하지 못했습니다');
  // 본문이 통째로 바뀌므로 레이아웃에 처음부터 있는 알림 영역으로 알립니다.
  useAnnounce('화면을 표시하지 못했습니다. 새로고침해 주세요.');
  return (
    <PageMessage title="화면을 표시하지 못했습니다">
      <p css={{ margin: '0 0 24px' }}>
        새로고침하면 대부분 해결됩니다. 입력하던 내용은 다시 입력해야 합니다.
      </p>
      <Button type="button" onClick={() => window.location.reload()}>
        새로고침
      </Button>
    </PageMessage>
  );
}
