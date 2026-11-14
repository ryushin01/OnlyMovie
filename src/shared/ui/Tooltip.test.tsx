import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Tooltip } from './Tooltip';

const view = (suppressed = false) =>
  render(
    <Tooltip label="다크 모드" suppressed={suppressed}>
      {(trigger) => (
        <button type="button" {...trigger}>
          <svg aria-hidden="true" />
        </button>
      )}
    </Tooltip>,
  );

it('말풍선 글자를 아이콘 버튼의 이름으로 쓰고, 평소에는 감춘다', () => {
  view();
  expect(screen.getByRole('button', { name: '다크 모드' })).toBeInTheDocument();
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

it('초점을 받으면 보이고 Esc로 닫으며, 초점이 떠났다 돌아오면 다시 보인다', async () => {
  const user = userEvent.setup();
  view();
  await user.tab();
  expect(screen.getByRole('tooltip')).toHaveTextContent('다크 모드');

  await user.keyboard('{Escape}');
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

  await user.tab();
  await user.tab();
  expect(screen.getByRole('button', { name: '다크 모드' })).toHaveFocus();
  expect(screen.getByRole('tooltip')).toBeVisible();
});

it('마우스를 올리면 보이고, 말풍선 위로 옮겨도 닫히지 않는다', async () => {
  const user = userEvent.setup();
  view();
  await user.hover(screen.getByRole('button'));
  const tooltip = screen.getByRole('tooltip');
  await user.hover(tooltip);
  expect(screen.getByRole('tooltip')).toBeVisible();

  await user.unhover(tooltip);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

it('같은 자리에 다른 내용이 열려 있으면 감춘다', async () => {
  const user = userEvent.setup();
  view(true);
  await user.tab();
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
