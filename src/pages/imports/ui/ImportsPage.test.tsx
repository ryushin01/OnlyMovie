import { screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { installFakeApi } from '@/shared/lib/test/fakeApi';
import { renderWithProviders } from '@/shared/lib/test/renderWithProviders';
import { ImportsPage } from './ImportsPage';

it('수입 이야기와 작품 링크를 보여 준다', async () => {
  installFakeApi();
  await renderWithProviders(<ImportsPage />);
  expect(screen.getByRole('heading', { level: 1, name: '수입 기획전' })).toBeInTheDocument();
  expect((await screen.findAllByText('영화제 상영에 그쳤던 작품을 들여왔습니다.')).length).toBeGreaterThan(0);
  expect(screen.getAllByRole('link', { name: '마지막 상영' })[0]).toHaveAttribute(
    'href',
    '/movies/last-screening',
  );
});

it('불러오지 못하면 알린다', async () => {
  const { state } = installFakeApi();
  state.fail = (_method, path) => path.startsWith('/api/movies');
  await renderWithProviders(<ImportsPage />);
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('불러오지 못했습니다'));
});
