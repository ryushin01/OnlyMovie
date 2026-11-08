import { expect, test } from '@playwright/test';
import { installFakeApi, MEMBER } from './fakeApi';

// README 스크린샷을 만듭니다. `pnpm screenshots`로 실행합니다. 화면의 데이터는 모두 가상입니다.
test.skip(!process.env.SCREENSHOTS, 'SCREENSHOTS=1일 때만 실행합니다.');

const shot = (name: string) => ({ path: `docs/images/${name}.jpg`, type: 'jpeg' as const, quality: 80 });

test('화면 캡처', async ({ browser, baseURL }) => {
  test.setTimeout(60_000);
  const viewport = { width: 1440, height: 900 };
  const desktop = await browser.newContext({ baseURL, viewport, colorScheme: 'dark' });
  const page = await desktop.newPage();
  const state = await installFakeApi(page, { user: MEMBER, plan: 'standard' });
  state.progress = { 'neon-rain': 2400, 'glass-orbit': 1500, 'iron-harbor': 3300 };
  state.watchlist = ['island-of-clocks', 'paper-whale', 'fog-kingdom'];
  state.alerts = ['island-of-clocks'];

  await page.goto('/');
  await expect(page.getByRole('region', { name: '국내 첫 공개' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.screenshot(shot('home-dark'));

  await page.getByRole('region', { name: '이어 보기' }).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 420));
  await page.waitForLoadState('networkidle');
  await page.screenshot(shot('home-member-dark'));
  await page.evaluate(() => window.scrollTo(0, 0));

  await page.setViewportSize({ width: 1200, height: 630 });
  await page.screenshot({ path: 'public/og-image.jpg', type: 'jpeg', quality: 85 });
  await page.setViewportSize(viewport);

  await page.goto('/movies?genre=%EB%93%9C%EB%9D%BC%EB%A7%88');
  await expect(page.locator('main output')).toContainText('영화');
  await page.getByText('상세 필터').click();
  await page.waitForLoadState('networkidle');
  await page.screenshot(shot('list-dark'));

  await page.goto('/movies/glass-orbit');
  await expect(page.getByRole('link', { name: /이어 보기/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '찜하기' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.screenshot(shot('detail-dark'));

  await page.goto('/watch/glass-orbit');
  await expect(page.getByRole('slider', { name: '재생 위치' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.screenshot(shot('player-dark'));

  await page.goto('/account');
  await expect(page.getByRole('region', { name: '찜한 영화' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.screenshot(shot('account-dark'));
  await desktop.close();

  const light = await browser.newContext({ baseURL, viewport, colorScheme: 'light' });
  const lightPage = await light.newPage();
  await installFakeApi(lightPage);
  await lightPage.goto('/');
  await expect(lightPage.getByRole('region', { name: '국내 첫 공개' })).toBeVisible();
  await lightPage.waitForLoadState('networkidle');
  await lightPage.screenshot(shot('home-light'));
  await lightPage.goto('/plans');
  await expect(lightPage.getByText('월 7,900원')).toBeVisible();
  await lightPage.screenshot(shot('plans-light'));
  await light.close();
});
