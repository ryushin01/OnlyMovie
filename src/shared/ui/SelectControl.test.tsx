import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { SelectControl } from './SelectControl';

it('레이블과 연결된 셀렉트로 동작하고, 직접 그린 화살표는 보조기기에서 숨긴다', async () => {
  render(
    <>
      <label htmlFor="genre">장르</label>
      <SelectControl id="genre" defaultValue="">
        <option value="">전체</option>
        <option value="SF">SF</option>
      </SelectControl>
    </>,
  );
  const select = screen.getByRole('combobox', { name: '장르' });
  await userEvent.selectOptions(select, 'SF');
  expect(select).toHaveValue('SF');
  expect(select.parentElement?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
});
