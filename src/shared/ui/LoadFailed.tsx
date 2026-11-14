import { useAnnounce } from '@/shared/lib/announcer';
import { PageMessage } from './PageMessage';

/**
 * 화면 전체의 데이터를 불러오지 못했을 때. 제목(h1)을 갖춘 안내로 본문을 대신합니다(KWCAG 6.4.2).
 * 본문이 통째로 바뀌면 그 안에 새로 생긴 알림 영역은 스크린 리더가 놓칠 수 있어,
 * 레이아웃에 처음부터 있는 알림 영역(`PageAnnouncer`)으로 알립니다.
 */
export function LoadFailed({ title }: { title: string }) {
  useAnnounce(`${title}. 잠시 뒤 새로고침해 주세요.`);
  return (
    <PageMessage title={title}>
      <p>잠시 뒤 새로고침해 주세요.</p>
    </PageMessage>
  );
}
