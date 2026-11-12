import { PageMessage } from './PageMessage';

/**
 * 화면 전체의 데이터를 불러오지 못했을 때. 제목(h1)을 갖춘 안내를 alert로 알립니다.
 * 본문 대신 문장 하나만 두면 쪽 제목이 없는 화면이 됩니다(KWCAG 6.4.2).
 */
export function LoadFailed({ title }: { title: string }) {
  return (
    <div role="alert">
      <PageMessage title={title}>
        <p>잠시 뒤 새로고침해 주세요.</p>
      </PageMessage>
    </div>
  );
}
