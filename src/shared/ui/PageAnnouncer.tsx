import { useAnnouncement } from '@/shared/lib/announcer';
import { visuallyHidden } from './styles';

/** 레이아웃에 한 번만 두는 알림 영역입니다. 앱이 시작될 때부터 있어서 안내를 넣으면 바로 읽힙니다. */
export function PageAnnouncer() {
  const message = useAnnouncement();
  return (
    <p role="alert" css={visuallyHidden}>
      {message}
    </p>
  );
}
