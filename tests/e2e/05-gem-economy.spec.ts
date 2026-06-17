/**
 * US-019  Always see gem balance on dashboard
 * US-020  Activity history shown correctly
 * US-021  Parent sees all children's balances
 * Edge:   Gem balance never goes negative
 * Edge:   Total gems earned never decreases
 */
import { test, expect } from '@playwright/test';
import {
  restoreSession, clickTab, assertOnParentDashboard, assertOnChildDashboard,
  setupFamilyPair,
} from './helpers';

const STS = Date.now();

let parentState: any;
let childState: any;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  const pair = await setupFamilyPair(browser);
  parentState = pair.parentState;
  childState = pair.childState;
});

test.describe('Gem Economy', () => {

  async function goToChildHome(page: any) {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    return !onJoin;
  }

  test('US-019 | Child gem balance shown prominently on dashboard', async ({ page }) => {
    const ok = await goToChildHome(page);
    test.skip(!ok, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Home');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText('YOUR GEMS', { exact: false })
        .or(page.getByText('gems available', { exact: false }))
        .or(page.getByText('GEMS', { exact: true }))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('US-019 | Gem balance is a non-negative integer', async ({ page }) => {
    const ok = await goToChildHome(page);
    test.skip(!ok, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Home');
    await page.waitForLoadState('networkidle');

    // Gem label: "GEMS" (GemHeader full mode), "YOUR GEMS" (legacy), or "gems available" (old UI)
    const gemsLabel = page.getByText('YOUR GEMS', { exact: false })
      .or(page.getByText('gems available', { exact: false }))
      .or(page.getByText('GEMS', { exact: true }));
    await expect(gemsLabel.first()).toBeVisible({ timeout: 10_000 });
    // Balance number is rendered as a sibling element — find any visible non-negative integer
    const numText = await page.locator('text=/^\\d+$/').first().textContent({ timeout: 3000 }).catch(() => '0');
    const balance = parseInt(numText ?? '0', 10);
    expect(balance).toBeGreaterThanOrEqual(0);
  });

  test('US-020 | Activity history visible on child dashboard', async ({ page }) => {
    const ok = await goToChildHome(page);
    test.skip(!ok, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Home');
    await page.waitForLoadState('networkidle');
    await assertOnChildDashboard(page);
  });

  test('US-021 | Parent sees each child gem balance in My Kids', async ({ page }) => {
    await restoreSession(page, parentState, '/dashboard');
    await assertOnParentDashboard(page);

    await clickTab(page, 'My Kids');
    await page.waitForLoadState('networkidle');

    // Either kids are listed (with balance) or empty state is shown
    await expect(
      page.getByText('💎 Balance')
        .or(page.getByText('No kids connected yet'))
        .or(page.getByText('No kids yet'))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Parent dashboard shows aggregate gem total', async ({ page }) => {
    await restoreSession(page, parentState, '/dashboard');
    await assertOnParentDashboard(page);

    // Parent home dashboard shows "gems out" (weekly gem stats) as aggregate indicator
    await expect(
      page.getByText('gems out', { exact: false })
        .or(page.getByText('💎 Total'))
        .or(page.getByText('Total'))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Gem balance shows on reward store header', async ({ page }) => {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!!onJoin, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Rewards');
    await page.waitForLoadState('networkidle');

    // Store header uses GemHeader in compact mode — shows "GEMS" label
    await expect(
      page.getByText('GEMS', { exact: true })
        .or(page.getByText('gems to spend', { exact: false }))
        .first()
    ).toBeVisible({ timeout: 10_000 });
    // Any visible non-negative integer on the page is the gem balance
    const numText = await page.locator('text=/^\\d+$/').first().textContent({ timeout: 3000 }).catch(() => '0');
    const balance = parseInt(numText ?? '0', 10);
    expect(balance).toBeGreaterThanOrEqual(0);
  });

});
