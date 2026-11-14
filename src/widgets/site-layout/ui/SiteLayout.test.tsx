import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi, renderWithProviders, Where } from '@/shared/lib/test';
import { SiteLayout } from './SiteLayout';

const view = () => renderWithProviders(<Where />, '/', { layout: SiteLayout });

describe('SiteLayout', () => {
  it('본문 바로가기 링크가 있다', async () => {
    installFakeApi();
    await view();
    expect(screen.getByRole('link', { name: '본문 바로가기' })).toHaveAttribute('href', '#main');
  });

  it('회원에게는 내 계정을 보여 주고, 화면을 옮기면 본문으로 초점을 옮긴다', async () => {
    installFakeApi();
    await view();
    await userEvent.click(await screen.findByRole('link', { name: '내 계정' }));
    expect(screen.getByText('위치: /account')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.queryByRole('link', { name: '회원가입' })).not.toBeInTheDocument();
  });

  it('방문자에게는 로그인과 회원가입을 보여 준다', async () => {
    installFakeApi({ user: null });
    await view();
    expect(await screen.findByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/signup');
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
  });

  it('로그인 상태를 확인하는 동안에는 회원 메뉴와 방문자 메뉴를 모두 숨긴다', async () => {
    const { state } = installFakeApi();
    let release = () => {};
    state.hold = new Promise((resolve) => {
      release = resolve;
    });
    await view();

    expect(screen.getByRole('link', { name: '이용권' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '로그인' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '회원가입' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '내 계정' })).not.toBeInTheDocument();

    release();
    expect(await screen.findByRole('link', { name: '내 계정' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '회원가입' })).not.toBeInTheDocument();
  });

  it('머리글 검색은 리스트로 이동한다', async () => {
    installFakeApi();
    await view();
    await userEvent.type(screen.getByLabelText('영화 검색'), '항구{Enter}');
    expect(screen.getByText('위치: /movies?q=항구')).toBeInTheDocument();
  });
});
