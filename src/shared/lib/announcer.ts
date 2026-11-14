import { useEffect, useSyncExternalStore } from 'react';

let current = '';
const listeners = new Set<() => void>();

function publish(message: string) {
  current = message;
  for (const listener of listeners) listener();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const snapshot = () => current;

/**
 * 화면 전체가 실패 안내로 바뀌는 경우처럼 영역째 새로 생기는 안내를, 레이아웃에 처음부터 있는 알림 영역으로 읽힙니다.
 * 안내한 화면이 사라지면 지웁니다.
 */
export function useAnnounce(message: string) {
  useEffect(() => {
    publish(message);
    return () => {
      if (current === message) publish('');
    };
  }, [message]);
}

/** 레이아웃의 알림 영역이 읽을 지금 안내 */
export const useAnnouncement = () => useSyncExternalStore(subscribe, snapshot, () => '');
