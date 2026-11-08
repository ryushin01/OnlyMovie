import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { MoonIcon, SunIcon } from '@/shared/ui/icons';
import { visuallyHidden } from '@/shared/ui/styles';

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

  const label = dark ? '라이트 모드' : '다크 모드';

  return (
    <Button
      variant="outline"
      onClick={toggle}
      title={label}
      css={{ width: 44, paddingInline: '0 !important' }}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
      <span css={visuallyHidden}>{label}</span>
    </Button>
  );
}
