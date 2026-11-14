import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi, renderWithProviders } from '@/shared/lib/test';
import { MovieFilterForm } from './MovieFilterForm';

describe('MovieFilterForm', () => {
  beforeEach(() => installFakeApi());

  it('적용을 눌러야 조건이 반영되고, 고른 조건만 주소에 담는다', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    await renderWithProviders(<MovieFilterForm filters={{}} onApply={onApply} />);

    await user.type(screen.getByLabelText('검색어'), '항구');
    await user.selectOptions(screen.getByLabelText('장르'), '액션');
    await user.click(screen.getByLabelText('국내 첫 공개작만 보기'));
    expect(onApply).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '적용' }));
    const query = new URLSearchParams(onApply.mock.calls[0][0]);
    expect(Object.fromEntries(query)).toEqual({
      q: '항구',
      genre: '액션',
      firstImport: 'true',
      sort: 'latest',
    });
  });

  it('상세 필터는 값이 있으면 펼쳐 두고 현재 값을 보여 준다', async () => {
    await renderWithProviders(
      <MovieFilterForm filters={{ year: 2025, actor: '도이나' }} onApply={() => {}} />,
    );
    await waitFor(() => expect(screen.getByLabelText('제작 연도')).toHaveValue('2025'));
    expect(screen.getByLabelText('배우')).toHaveValue('도이나');
    expect(screen.getByText('상세 필터').closest('details')).toHaveAttribute('open');
  });

  it('장르 목록에 TV 영화가 없다', async () => {
    await renderWithProviders(<MovieFilterForm filters={{}} onApply={() => {}} />);
    expect(screen.queryByRole('option', { name: 'TV 영화' })).not.toBeInTheDocument();
  });
});
