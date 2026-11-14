import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderWithProviders } from '@/shared/lib/test';
import { RouteErrorPage } from './RouteErrorPage';

it('RouteErrorPage는 안내와 새로고침 버튼을 보여 주고 문서 제목을 바꾼다', async () => {
  await renderWithProviders(<RouteErrorPage />);
  expect(screen.getByRole('heading', { level: 1, name: '화면을 표시하지 못했습니다' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument();
  expect(document.title).toBe('화면을 표시하지 못했습니다 | OnlyMovie');
});
