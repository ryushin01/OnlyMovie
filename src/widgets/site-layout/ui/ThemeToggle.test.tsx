import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

it('ThemeToggle은 테마를 바꾸고 저장하며, 버튼 글자를 전환할 모드로 바꾼다', async () => {
  document.documentElement.dataset.theme = 'light';
  render(<ThemeToggle />);
  const button = screen.getByRole('button', { name: '다크 모드' });

  await userEvent.click(button);

  expect(button).toHaveAccessibleName('라이트 모드');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(localStorage.getItem('only-movie-theme')).toBe('dark');

  await userEvent.click(button);

  expect(button).toHaveAccessibleName('다크 모드');
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(localStorage.getItem('only-movie-theme')).toBe('light');
});

it('ThemeToggle은 다크 모드로 시작하면 라이트 모드 전환 버튼을 보여 준다', () => {
  document.documentElement.dataset.theme = 'dark';
  render(<ThemeToggle />);

  expect(screen.getByRole('button', { name: '라이트 모드' })).toBeInTheDocument();
});
