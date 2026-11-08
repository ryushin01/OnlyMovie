import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { installFakeApi, MEMBER, seedMovies } from './fakeApi';

/** Safari의 Tab은 기본 설정에서 링크와 버튼을 건너뛰고, Option+Tab은 모두 지나갑니다. */
const tabKey = (browserName: string) => (browserName === 'webkit' ? 'Alt+Tab' : 'Tab');

async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

const results = (page: Page) => page.locator('main output');

test('메인에서 리스트를 거쳐 디테일로 들어간다', async ({ page }) => {
  await installFakeApi(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /시네필을 위한 영화 전문 OTT/ })).toBeVisible();
  const firstImports = page.getByRole('region', { name: '국내 첫 공개' });
  await expect(firstImports.getByText('국내 첫 공개').first()).toBeVisible();

  await firstImports.getByRole('link', { name: '국내 첫 공개 전체 보기' }).click();
  await expect(page).toHaveURL(/\/movies\?firstImport=true&status=now$/);
  await expect(page.getByRole('heading', { level: 1, name: '영화 찾기' })).toBeVisible();
  await expect(page.getByLabel('국내 첫 공개작만 보기')).toBeChecked();
  await expect(page.getByRole('main')).toBeFocused();

  await page.getByRole('link', { name: '마지막 상영' }).click();
  await expect(page).toHaveURL(/\/movies\/last-screening$/);
  await expect(page.getByRole('heading', { level: 1, name: '마지막 상영' })).toBeVisible();
  for (const text of [
    'Ultima Proiecție',
    '전체 관람가',
    '1시간 52분 (112분)',
    '주제',
    '일리에 바르부',
    '소린 마테이',
  ]) {
    await expect(page.getByRole('main').getByText(text, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByRole('heading', { name: '수입 이야기' })).toBeVisible();
});

test('머리글에서 제목, 감독, 배우로 검색한다', async ({ page }) => {
  await installFakeApi(page);
  await page.goto('/');
  // 검색 버튼 글자가 두 줄로 꺾이지 않습니다.
  const button = await page.getByRole('search').getByRole('button', { name: '검색' }).boundingBox();
  expect(button?.height).toBeLessThanOrEqual(50);
  const box = page.getByLabel('영화 검색');

  await box.fill('철의 항구');
  await box.press('Enter');
  await expect(results(page)).toHaveText('영화 1편');
  await expect(page.getByRole('link', { name: '철의 항구' })).toBeVisible();
  await expect(page.getByLabel('검색어')).toHaveValue('철의 항구');

  await box.fill('곤살로');
  await page.getByRole('search').getByRole('button', { name: '검색' }).click();
  await expect(results(page)).toHaveText('영화 1편');

  await box.fill('루시아 알코바');
  await box.press('Enter');
  await expect(page.getByRole('link', { name: '네온 레인' })).toBeVisible();

  await box.fill('세상에 없는 영화');
  await box.press('Enter');
  await expect(results(page)).toHaveText('영화 0편');
  await expect(page.getByText('조건에 맞는 영화가 없습니다.', { exact: false })).toBeVisible();
});

test('여러 필터를 함께 적용하고, 주소로 공유하고, 뒤로 가면 되돌아온다', async ({ page }) => {
  await installFakeApi(page);
  await page.goto('/movies');
  await expect(results(page)).toHaveText('영화 36편');

  await page.getByLabel('장르').selectOption('범죄');
  await page.getByText('상세 필터').click();
  await page.getByLabel('제작 연도').selectOption('2026');
  await page.getByLabel('제작 국가').selectOption('칠레');
  await page.getByLabel('관람 등급').selectOption('15');
  await page.getByLabel('러닝타임').selectOption('medium');
  // 적용하기 전에는 결과가 바뀌지 않습니다.
  await expect(results(page)).toHaveText('영화 36편');

  await page.getByRole('button', { name: '적용' }).click();
  await expect(results(page)).toHaveText('영화 1편');
  await expect(page.getByRole('link', { name: '철의 항구' })).toBeVisible();
  const shared = page.url();
  expect(shared).toContain('year=2026');

  await page.goBack();
  await expect(results(page)).toHaveText('영화 36편');
  await expect(page.getByLabel('장르')).toHaveValue('');

  await page.goto(shared);
  await expect(results(page)).toHaveText('영화 1편');
  await expect(page.getByLabel('제작 국가')).toHaveValue('칠레');
  await expect(page.getByLabel('관람 등급')).toHaveValue('15');

  await page.getByRole('link', { name: '초기화' }).click();
  await expect(results(page)).toHaveText('영화 36편');
});

test('공개 예정작은 공개일을 알리고 재생할 수 없다', async ({ page }) => {
  await installFakeApi(page, { user: MEMBER, plan: 'premium' });
  await page.goto('/movies?status=upcoming');
  await expect(results(page)).toHaveText('영화 4편');
  await expect(page.getByText('2027.01.15 공개')).toBeVisible();
  await page.getByRole('link', { name: '시계의 섬' }).click();
  await expect(page.getByText('2027.01.15 공개 예정')).toBeVisible();
  await expect(page.getByRole('link', { name: '재생' })).toHaveCount(0);

  await page.goto('/watch/island-of-clocks');
  await expect(page.getByRole('heading', { name: '아직 공개되지 않은 영화입니다' })).toBeVisible();
});

test('디테일의 감독과 배우를 누르면 그 조건으로 찾는다', async ({ page }) => {
  await installFakeApi(page);
  await page.goto('/movies/iron-harbor');
  await page.getByRole('link', { name: '발렌티나 오르테가' }).click();
  await expect(results(page)).toHaveText('영화 1편');
  await expect(page.getByLabel('배우')).toHaveValue('발렌티나 오르테가');
  await expect(page.getByText('상세 필터').locator('..')).toHaveAttribute('open', '');

  await page.goto('/movies/iron-harbor');
  await page.getByRole('link', { name: '곤살로 피네다' }).click();
  await expect(page.getByLabel('감독')).toHaveValue('곤살로 피네다');
});

test('리스트를 페이지로 나눈다', async ({ page }) => {
  await installFakeApi(page);
  await page.goto('/movies');
  await expect(page.locator('main ul li article')).toHaveCount(24);
  await page.getByRole('link', { name: /^2\s*페이지$/ }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('main ul li article')).toHaveCount(12);
  await expect(page.getByRole('link', { name: /^2\s*페이지$/ })).toHaveAttribute('aria-current', 'page');
});

test('회원가입하고 이용권을 결제해 영화를 재생한다', async ({ page }) => {
  const state = await installFakeApi(page);
  await page.goto('/movies/last-screening');
  await page.getByRole('link', { name: '로그인하고 보기' }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByRole('main').getByRole('link', { name: '회원가입' }).click();

  await page.getByRole('button', { name: '가입하기' }).click();
  await expect(page.getByText('오류: 이름을 입력해 주세요.')).toBeVisible();
  await expect(page.getByLabel('이름 (필수)')).toBeFocused();

  await page.getByLabel('이름 (필수)').fill('새 시네필');
  await page.getByLabel('이메일 (필수)').fill('cinephile@example.com');
  await page.getByLabel('비밀번호 (필수)').fill('password1');
  await page.getByRole('button', { name: '가입하기' }).click();

  await expect(page).toHaveURL(/\/movies\/last-screening$/);
  await page.getByRole('link', { name: '이용권 구매하고 보기' }).click();
  await page.getByRole('link', { name: '스탠다드 시작하기' }).click();
  await expect(page.getByText('카드 정보를 받지 않습니다', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '10,900원 가상 결제' }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('heading', { name: '스탠다드 이용권 이용 중' })).toBeVisible();
  await expect(
    page.getByRole('table', { name: '가상 결제 내역' }).getByRole('cell', { name: '10,900원' }),
  ).toBeVisible();
  expect(state.subscription?.plan).toBe('standard');

  await page.goto('/movies/last-screening');
  await page.getByRole('link', { name: '재생' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '마지막 상영' })).toBeVisible();
  await expect(page.getByText('FHD', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '재생' })).toBeVisible();
});

test('메일 확인이 필요한 가입은 안내하고, 메일의 링크로 들어오면 로그인된다', async ({ page }) => {
  const state = await installFakeApi(page, { requireEmailConfirmation: true });
  await page.goto('/signup');
  await page.getByLabel('이름 (필수)').fill('새 시네필');
  await page.getByLabel('이메일 (필수)').fill('cinephile@example.com');
  await page.getByLabel('비밀번호 (필수)').fill('password1');
  await page.getByRole('button', { name: '가입하기' }).click();
  await expect(
    page.getByText('cinephile@example.com로 확인 메일을 보냈습니다.', { exact: false }),
  ).toBeVisible();
  expect(state.user).toBeNull();

  // 메일의 링크는 사이트 첫 화면으로 들어옵니다.
  await page.goto('/#confirmation_token=abc');
  await expect(
    page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '내 계정' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1, name: /시네필을 위한/ })).toBeVisible();
  // 다른 회원이 아니라 가입한 사람으로 로그인됩니다.
  expect(state.user).toMatchObject({ id: 'u-new', email: 'cinephile@example.com' });
  await page.getByRole('link', { name: '내 계정' }).click();
  await expect(page.getByText('새 시네필 · cinephile@example.com')).toBeVisible();
});

test('결제 실패를 안내하고 이용권을 시작하지 않는다', async ({ page }) => {
  const state = await installFakeApi(page, { user: MEMBER });
  await page.goto('/checkout/basic');
  await page.getByRole('radio', { name: '결제 실패' }).check();
  await page.getByRole('button', { name: '7,900원 가상 결제' }).click();
  await expect(page.getByRole('alert')).toContainText('가상 결제에 실패했습니다');
  await expect(page.getByRole('alert')).toBeFocused();
  expect(state.subscription).toBeNull();

  await page.getByRole('radio', { name: '결제 성공' }).check();
  await page.getByRole('button', { name: '7,900원 가상 결제' }).click();
  await expect(page.getByRole('heading', { name: '베이직 이용권 이용 중' })).toBeVisible();
});

test('결제를 두 번 눌러도 한 번만 요청한다', async ({ page }) => {
  const state = await installFakeApi(page, { user: MEMBER });
  state.delay = 500;
  await page.goto('/checkout/basic');
  const pay = page.getByRole('button', { name: '7,900원 가상 결제' });
  await pay.dblclick();
  await expect(page.getByRole('heading', { name: '베이직 이용권 이용 중' })).toBeVisible();
  expect(state.posts).toBe(1);
});

test('베이직은 국내 첫 공개작이 막혀 있고, 이용권을 올리면 볼 수 있다', async ({ page }) => {
  const state = await installFakeApi(page, { user: MEMBER, plan: 'basic' });
  await page.goto('/movies/silent-floor');
  await expect(page.getByRole('link', { name: '재생' })).toBeVisible();

  await page.goto('/watch/last-screening');
  await expect(page.getByRole('heading', { name: '이용권이 필요합니다' })).toBeVisible();

  await page.goto('/movies/last-screening');
  await page.getByRole('link', { name: '이용권 올리고 보기' }).click();
  await page.getByRole('button', { name: /프리미엄\(으\)로 올리기 \(차액 6,000원/ }).click();
  await expect(page.getByRole('heading', { name: '프리미엄 이용권 이용 중' })).toBeVisible();
  expect(state.payments[0]).toMatchObject({ kind: 'upgrade', amount: 6000 });

  await page.goto('/watch/last-screening');
  await expect(page.getByText('4K', { exact: true })).toBeVisible();
});

test('이용권을 낮추면 다음 결제일로 예약되고, 해지와 취소를 할 수 있다', async ({ page }) => {
  await installFakeApi(page, { user: MEMBER, plan: 'premium' });
  await page.goto('/account');
  await page.getByRole('button', { name: '베이직(으)로 낮추기' }).click();
  await expect(page.getByText('다음 결제일부터 베이직 이용권으로 바뀝니다.')).toBeVisible();
  await page.getByRole('button', { name: '변경 예약 취소' }).click();
  await expect(page.getByText('다음 결제일부터', { exact: false })).toHaveCount(0);

  let dialogText = '';
  page.once('dialog', (dialog) => {
    dialogText = dialog.message();
    return dialog.dismiss();
  });
  await page.getByRole('button', { name: '해지하기' }).click();
  expect(dialogText).toContain('해지할까요');
  await expect(page.getByRole('button', { name: '해지 취소' })).toHaveCount(0);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '해지하기' }).click();
  await expect(page.getByText(/해지됩니다\. 그때까지 계속 볼 수 있습니다\./)).toBeVisible();
  await page.getByRole('button', { name: '해지 취소' }).click();
  await expect(page.getByRole('button', { name: '해지하기' })).toBeVisible();
});

test('방문자는 회원 화면 대신 로그인으로 가고, 로그인하면 돌아온다', async ({ page }) => {
  await installFakeApi(page);
  await page.goto('/checkout/premium');
  await expect(page).toHaveURL(/\/login\?next=%2Fcheckout%2Fpremium$/);
  await page.getByLabel('이메일 (필수)').fill('member@example.com');
  await page.getByLabel('비밀번호 (필수)').fill('password1');
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL(/\/checkout\/premium$/);
  await expect(page.getByRole('heading', { level: 1, name: '프리미엄 이용권' })).toBeVisible();

  await page.goto('/login?next=https://evil.example');
  await expect(page.getByRole('heading', { level: 1, name: '로그인' })).toBeVisible();
});

test('로그아웃하면 회원 메뉴가 닫힌다', async ({ page }) => {
  await installFakeApi(page, { user: MEMBER, plan: 'basic' });
  await page.goto('/');
  await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(
    page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '로그인' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: '내 계정' })).toHaveCount(0);
});

test('찜한 영화가 메인과 내 계정에 나오고 뺄 수 있다', async ({ page }) => {
  await installFakeApi(page, { user: MEMBER });
  await page.goto('/movies/island-of-clocks');
  const button = page.getByRole('button', { name: '찜하기' });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/');
  await expect(
    page.getByRole('region', { name: '찜한 영화' }).getByRole('link', { name: '시계의 섬' }),
  ).toBeVisible();
  await page.goto('/account');
  await expect(
    page.getByRole('region', { name: '찜한 영화' }).getByRole('link', { name: '시계의 섬' }),
  ).toBeVisible();

  await page.goto('/movies/island-of-clocks');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await page.goto('/');
  await expect(page.getByRole('region', { name: '국내 첫 공개' })).toBeVisible();
  await expect(page.getByRole('region', { name: '찜한 영화' })).toHaveCount(0);
});

test('보던 위치를 저장해 메인과 디테일에서 이어 본다', async ({ page }) => {
  const state = await installFakeApi(page, { user: MEMBER, plan: 'standard' });
  await page.goto('/watch/last-screening');
  const seek = page.getByRole('slider', { name: '재생 위치' });
  await seek.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: '재생' }).click();
  await page.getByRole('button', { name: '일시정지' }).click();
  await expect.poll(() => state.progress['last-screening']).toBeGreaterThanOrEqual(30);

  await page.goto('/');
  const row = page.getByRole('region', { name: '이어 보기' });
  await expect(row.getByRole('link', { name: '마지막 상영' })).toBeVisible();
  await expect(row.getByText('남음')).toBeVisible();

  await row.getByRole('link', { name: '마지막 상영' }).click();
  await page.getByRole('link', { name: /^이어 보기 \(0:00:3\d부터\)$/ }).click();
  await expect(page.getByText(/^0:00:3\d \/ 1:52:00$/)).toBeVisible();
  await expect(page.getByRole('button', { name: '재생' })).toBeVisible();
});

test('디테일에서 비슷한 영화로 넘어간다', async ({ page }) => {
  await installFakeApi(page);
  await page.goto('/movies/iron-harbor');
  const related = page.getByRole('region', { name: '비슷한 영화' });
  await expect(related.getByRole('link', { name: '철의 항구' })).toHaveCount(0);
  await related.getByRole('link', { name: '먼지의 보안관' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '먼지의 보안관' })).toBeVisible();
});

test('회원 탈퇴를 확인하면 기록이 지워지고 로그아웃된다', async ({ page }) => {
  const state = await installFakeApi(page, { user: MEMBER, plan: 'standard' });
  await page.goto('/account');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: '회원 탈퇴' }).click();
  expect(state.user).not.toBeNull();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '회원 탈퇴' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('banner').getByRole('link', { name: '회원가입' })).toBeVisible();
  expect(state.user).toBeNull();
  expect(state.subscription).toBeNull();
});

test('불러오는 동안 스켈레톤을 보여 주고 도착하면 없앤다', async ({ page }) => {
  await installFakeApi(page);
  const skeleton = page.locator('main [data-skeleton="card"]');
  const hold = (pattern: string) => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    return page
      .route(pattern, async (route) => {
        await gate;
        await route.fallback();
      })
      .then(() => release);
  };

  let release = await hold('**/api/home');
  await page.goto('/');
  await expect(skeleton.first()).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('영화를 불러오는 중입니다.');
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolations(page);
  release();
  await expect(page.getByRole('region', { name: '국내 첫 공개' })).toBeVisible();
  await expect(skeleton).toHaveCount(0);
  await page.unroute('**/api/home');

  release = await hold('**/api/movies/iron-harbor');
  await page.goto('/movies/iron-harbor');
  await expect(page.locator('main [data-skeleton="detail"]')).toBeVisible();
  release();
  await expect(page.getByRole('heading', { level: 1, name: '철의 항구' })).toBeVisible();
  await expect(page.locator('main [data-skeleton="detail"]')).toHaveCount(0);
  await page.unroute('**/api/movies/iron-harbor');

  release = await hold('**/api/movies?*');
  await page.goto('/movies?genre=SF');
  await expect(skeleton.first()).toBeVisible();
  await expectNoAxeViolations(page);
  release();
  await expect(page.getByRole('main').getByRole('status').first()).toContainText('영화');
  await expect(skeleton).toHaveCount(0);
});

test('포스터 이미지가 도착할 때까지 스켈레톤을 그리고, 움직임 줄이기를 따른다 [컨텍스트]', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await installFakeApi(page);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/seed/last-screening-poster.svg', async (route) => {
    await gate;
    await route.continue();
  });
  // 붙잡아 둔 이미지 때문에 Firefox의 load 이벤트가 끝나지 않으므로 기다리지 않습니다.
  await page.goto('/movies/last-screening', { waitUntil: 'commit' });
  const poster = page.getByAltText('마지막 상영 포스터');
  await expect(poster).toHaveAttribute('data-skeleton', 'poster');
  await expect(poster).toHaveCSS('animation-name', 'none');
  release();
  await expect(poster).not.toHaveAttribute('data-skeleton');
  await context.close();
});

test('플레이어를 키보드로 조작하고 자동으로 재생하지 않는다', async ({ page, browserName }) => {
  await installFakeApi(page, { user: MEMBER, plan: 'standard' });
  await page.goto('/watch/last-screening');
  const play = page.getByRole('button', { name: '재생' });
  await expect(play).toBeVisible();
  await expect(page.getByText('0:00:00 / 1:52:00')).toBeVisible();

  await play.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '일시정지' })).toBeFocused();

  await page.keyboard.press(tabKey(browserName));
  await expect(page.getByRole('slider', { name: '재생 위치' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('slider', { name: '재생 위치' })).toHaveValue('10');
});

test('화면 폭에 따라 한 줄의 카드 수가 달라지고 다음 버튼으로 넘긴다 [컨텍스트]', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await installFakeApi(page);
  await page.goto('/');
  const list = page.getByRole('region', { name: '최근 공개' }).getByRole('list');
  await expect(list.getByRole('listitem').first()).toBeVisible();
  const ratio = await list.evaluate((element) => element.clientWidth / element.children[0].clientWidth);
  // 메인의 줄은 가로형 카드라 1440px에서 네 장 남짓 보입니다.
  expect(ratio).toBeGreaterThan(4);
  expect(ratio).toBeLessThan(6);
  // 부드러운 스크롤은 로딩 중 레이아웃이 바뀌면 끊길 수 있어, 애니메이션을 끄고 로딩이 끝난 뒤 누릅니다.
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '최근 공개 다음 목록' }).click();
  await expect.poll(() => list.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await context.close();
});

test('주요 메뉴는 넓은 화면에서 왼쪽 레일, 좁은 화면에서 아래쪽 탭 막대가 된다 [컨텍스트]', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await installFakeApi(page);
  await page.goto('/plans');
  const rail = page.getByRole('navigation', { name: '주요 메뉴' });
  await expect(rail.getByRole('link', { name: '이용권' })).toHaveAttribute('aria-current', 'page');
  const wide = await rail.boundingBox();
  expect(wide?.x).toBe(16);
  expect(wide?.width).toBe(88);

  await page.setViewportSize({ width: 360, height: 740 });
  const narrow = await rail.boundingBox();
  expect(narrow?.width).toBe(360);
  expect((narrow?.y ?? 0) + (narrow?.height ?? 0)).toBe(740);

  // 끝까지 내려도 바닥글이 탭 막대에 가리지 않습니다.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const footer = await page.getByRole('contentinfo').boundingBox();
  expect((footer?.y ?? 0) + (footer?.height ?? 0)).toBeLessThanOrEqual((await rail.boundingBox())?.y ?? 0);
  await context.close();
});

test('공개 예정작에 알림을 걸면 알림 목록에 나타나고, 새로 공개된 작품은 확인할 때까지 표시된다', async ({
  page,
}) => {
  const state = await installFakeApi(page, { user: MEMBER, plan: 'standard' });
  state.alerts = ['neon-rain'];
  await page.goto('/movies/island-of-clocks');
  await page.getByRole('button', { name: '공개 알림 받기' }).click();
  await expect(page.getByRole('button', { name: '공개 알림 받기' })).toHaveAttribute('aria-pressed', 'true');

  const bell = page.getByRole('button', { name: '공개 알림 새 소식 1건' });
  await bell.click();
  await expect(page.getByRole('banner').getByRole('link', { name: /시계의 섬/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(bell).toHaveCount(0);
  await expect(page.getByRole('button', { name: '공개 알림', exact: true })).toBeFocused();
  expect(state.alertsRead).toContain('neon-rain');
});

test('이어 보기에서 작품을 지운다', async ({ page }) => {
  const state = await installFakeApi(page, { user: MEMBER, plan: 'standard' });
  state.progress = { 'neon-rain': 2400, 'glass-orbit': 1500 };
  await page.goto('/');
  const row = page.getByRole('region', { name: '이어 보기' });
  await row.getByRole('button', { name: '네온 레인 이어 보기에서 지우기' }).click();
  await expect(row.getByRole('link', { name: '네온 레인' })).toHaveCount(0);
  await expect(row.getByRole('link', { name: '유리 궤도' })).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
});

test('동시 시청 대수를 넘으면 재생을 멈추고 안내한다', async ({ page }) => {
  const state = await installFakeApi(page, { user: MEMBER, plan: 'standard' });
  state.screensFull = true;
  await page.goto('/watch/glass-orbit');
  await page.getByRole('button', { name: '재생' }).click();
  await expect(page.getByRole('alert')).toContainText('동시 시청 대수');
  await expect(page.getByRole('button', { name: '재생' })).toBeVisible();
});

test('검색하면 결과 아래에 연관 영화를 잇고, 탭으로 공개 상태를 고른다', async ({ page }) => {
  await installFakeApi(page);
  await page.goto('/movies?q=%EC%B2%A0%EC%9D%98');
  await expect(page.getByRole('region', { name: '연관 영화' })).toBeVisible();
  const tabs = page.getByRole('navigation', { name: '공개 상태' });
  await tabs.getByRole('link', { name: '공개 예정' }).click();
  await expect(page).toHaveURL(/status=upcoming/);
  await expect(tabs.getByRole('link', { name: '공개 예정' })).toHaveAttribute('aria-current', 'page');
  await expect(tabs.getByRole('link', { name: '전체' })).not.toHaveAttribute('aria-current', 'page');
});

test('키보드 순서는 로고, 검색창, 도구, 주요 메뉴 순이다', async ({ page }) => {
  await installFakeApi(page);
  await page.goto('/');
  await page.getByRole('banner').getByRole('link', { name: 'OnlyMovie' }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('영화 검색')).toBeFocused();
});

test('다크 모드를 저장하고 시스템 설정을 따른다', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, colorScheme: 'dark' });
  const page = await context.newPage();
  await installFakeApi(page);
  await page.goto('/');
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme);

  expect(await theme()).toBe('dark');
  await page.getByRole('button', { name: '라이트 모드' }).click();
  expect(await theme()).toBe('light');
  await expect(page.getByRole('button', { name: '다크 모드' })).toBeVisible();
  await page.reload();
  expect(await theme()).toBe('light');
  await expect(page.getByRole('button', { name: '다크 모드' })).toBeVisible();
  await context.close();
});

test('키보드로 본문 바로가기를 쓸 수 있다', async ({ page, browserName }) => {
  await installFakeApi(page);
  await page.goto('/');
  // 화면이 그려지기 전에 Tab을 누르면 초점이 갈 곳이 없습니다.
  await expect(page.getByRole('link', { name: '본문 바로가기' })).toBeAttached();
  await page.keyboard.press(tabKey(browserName));
  await expect(page.getByRole('link', { name: '본문 바로가기' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await expect(page.getByRole('main')).toHaveCSS('outline-style', 'solid');
});

test('없는 주소와 없는 영화를 안내한다', async ({ page }) => {
  await installFakeApi(page);
  await page.goto('/nope');
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeVisible();
  await page.goto('/movies/nope');
  await expect(page.getByRole('heading', { name: '영화를 찾을 수 없습니다' })).toBeVisible();
  await page.goto('/checkout/nope');
  await expect(page.getByRole('heading', { name: '이용권을 찾을 수 없습니다' })).toBeVisible();
});

test('API가 실패하면 안내한다', async ({ page }) => {
  await installFakeApi(page);
  await page.route('**/api/home', (route) => route.fulfill({ status: 500, json: {} }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('불러오지 못했습니다');
});

// 화면을 모두 지나며 넘침과 접근성을 검사합니다.
const VISITOR_PAGES: [string, string][] = [
  ['/', '시네필을 위한'],
  ['/movies', '영화 찾기'],
  ['/movies?year=2026&sort=title', '영화 찾기'],
  ['/movies/last-screening', '마지막 상영'],
  ['/movies/island-of-clocks', '시계의 섬'],
  ['/imports', '수입 기획전'],
  ['/plans', '이용권'],
  ['/login', '로그인'],
  ['/signup', '회원가입'],
  ['/nope', '페이지를 찾을 수 없습니다'],
];
const MEMBER_PAGES: [string, string][] = [
  ['/', '시네필을 위한'],
  ['/movies/last-screening', '마지막 상영'],
  ['/imports', '수입 기획전'],
  ['/plans', '이용권'],
  ['/account', '내 계정'],
  ['/watch/last-screening', '마지막 상영'],
];

for (const colorScheme of ['light', 'dark'] as const) {
  for (const [width, height] of [
    [320, 640],
    [1440, 900],
    [2200, 1200],
  ] as const) {
    test(`${colorScheme} ${width}px: 넘침과 접근성 [컨텍스트]`, async ({ browser, baseURL }) => {
      test.setTimeout(90_000);
      // 호버 전환 중간 색을 재지 않도록 애니메이션을 끕니다.
      const context = await browser.newContext({
        baseURL,
        colorScheme,
        viewport: { width, height },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      const state = await installFakeApi(page);

      const visit = async ([path, heading]: [string, string]) => {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
        await expect(
          page.locator('main output:has-text("불러오는 중"), main output:has-text("확인하는 중")'),
        ).toHaveCount(0);
        await expectNoHorizontalOverflow(page);
        await expectNoAxeViolations(page);
      };

      for (const entry of VISITOR_PAGES) await visit(entry);

      state.user = MEMBER;
      await page.goto('/checkout/standard');
      await expect(page.getByRole('heading', { level: 1, name: '스탠다드 이용권' })).toBeVisible();
      await page.getByRole('radio', { name: '결제 실패' }).check();
      await page.getByRole('button', { name: '10,900원 가상 결제' }).click();
      await expect(page.getByRole('alert')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNoAxeViolations(page);

      await page.getByRole('radio', { name: '결제 성공' }).check();
      await page.getByRole('button', { name: '10,900원 가상 결제' }).click();
      await expect(page.getByRole('heading', { name: '스탠다드 이용권 이용 중' })).toBeVisible();
      for (const entry of MEMBER_PAGES) await visit(entry);

      await context.close();
    });
  }
}

test('긴 제목도 넘치지 않는다 [컨텍스트]', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 740 } });
  const page = await context.newPage();
  const movies = seedMovies();
  movies[0].title = 'A'.repeat(100);
  movies[0].originalTitle = 'B'.repeat(100);
  await installFakeApi(page, { movies });
  await page.goto('/movies/last-screening');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A'.repeat(100));
  await expectNoHorizontalOverflow(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.goto('/movies');
  await expect(results(page)).toHaveText('영화 36편');
  await expectNoHorizontalOverflow(page);
  await context.close();
});

// 1mm = 96/25.4px
const MIN_DIAGONAL_PX = (6 * 96) / 25.4;

test('모든 컨트롤의 대각선 길이가 6mm 이상이다 [컨텍스트]', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 740 } });
  const page = await context.newPage();
  await installFakeApi(page, { user: MEMBER, plan: 'standard' });
  for (const path of [
    '/',
    '/movies',
    '/movies/last-screening',
    '/imports',
    '/plans',
    '/account',
    '/watch/last-screening',
    '/login',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('main output:has-text("중입니다")')).toHaveCount(0);
    const sizes = await page
      .locator(
        'main a, main button, main input, main select, main summary, header a, header button, header input',
      )
      .evaluateAll((elements) =>
        // 이 폭에서 그려지지 않는 요소(닫힌 알림 목록, 넓은 화면 전용 패널)는 조작할 수 없으므로 뺍니다.
        elements
          .filter((element) => element.getClientRects().length > 0)
          .map((element) => {
            const { width, height } = element.getBoundingClientRect();
            return { name: element.textContent || element.id, diagonal: Math.hypot(width, height) };
          }),
      );
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.filter((size) => size.diagonal < MIN_DIAGONAL_PX)).toEqual([]);
  }
  await context.close();
});

test('운영과 같은 CSP에서 주요 화면이 정책 위반 없이 동작한다', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/content security policy|content-security-policy/i.test(message.text()))
      violations.push(message.text());
  });
  await installFakeApi(page);
  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("script-src 'self'");
  await expect(page.locator('html')).toHaveAttribute('data-theme', /^(dark|light)$/);
  await expect(page.getByRole('region', { name: '국내 첫 공개' })).toBeVisible();

  await page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '이용권' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '로그인' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '로그인' })).toBeVisible();
  await page.goto('/movies');
  await expect(page.getByRole('heading', { level: 1, name: '영화 찾기' })).toBeVisible();
  const movie = seedMovies()[0];
  await page.goto(`/movies/${movie.id}`);
  await expect(page.getByRole('heading', { level: 1, name: movie.title })).toBeVisible();
  expect(violations).toEqual([]);
});

test('화면을 그리다 오류가 나면 머리글을 유지한 채 안내하고 다른 화면으로 갈 수 있다', async ({ page }) => {
  await installFakeApi(page);
  // 응답 형식이 어긋나 화면이 그리는 도중에 실패하는 경우입니다.
  await page.route('**/api/home', (route) =>
    route.fulfill({ json: { featured: seedMovies()[0], rows: null } }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: '화면을 표시하지 못했습니다' })).toBeVisible();
  await expect(page).toHaveTitle('화면을 표시하지 못했습니다 | OnlyMovie');
  await expect(page.getByRole('button', { name: '새로고침' })).toBeVisible();
  await expectNoAxeViolations(page);

  const nav = page.getByRole('navigation', { name: '주요 메뉴' });
  await nav.getByRole('link', { name: '이용권' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '화면을 표시하지 못했습니다' })).toBeHidden();
  await expect(page).toHaveURL(/\/plans$/);
});
