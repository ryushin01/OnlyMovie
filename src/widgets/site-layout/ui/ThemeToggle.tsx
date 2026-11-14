import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { MoonIcon, SunIcon } from '@/shared/ui/icons';
import { Tooltip } from '@/shared/ui/Tooltip';

const STORAGE_KEY = 'only-movie-theme';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');

  const toggle = () => {
    const next = !dark;
    setDark(next);
    const theme = next ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // 저장할 수 없는 환경이면 이번 방문에만 적용합니다.
    }
  };

  // 버튼 이름은 누르면 바뀔 모드입니다. 아이콘만 있으므로 툴팁 글자를 이름으로 씁니다.
  const label = dark ? '라이트 모드' : '다크 모드';

  return (
    <Tooltip label={label} align="end">
      {(trigger) => (
        <Button
          variant="outline"
          onClick={toggle}
          css={{ width: 44, minHeight: 44, padding: 0 }}
          {...trigger}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </Button>
      )}
    </Tooltip>
  );
}
