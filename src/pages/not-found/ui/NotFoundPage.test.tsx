import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderWithProviders } from '@/shared/lib/test';
import { NotFoundPage } from './NotFoundPage';

it('NotFoundPage는 안내와 메인 링크를 보여 준다', async () => {
  await renderWithProviders(<NotFoundPage />);
  expect(screen.getByRole('heading', { level: 1, name: '페이지를 찾을 수 없습니다' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '메인으로' })).toHaveAttribute('href', '/');
});
