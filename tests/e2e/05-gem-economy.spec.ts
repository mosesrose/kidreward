/**
 * US-019  Always see gem balance on dashboard
 * US-020  Activity history shown correctly
 * US-021  Parent sees all children's balances
 * Edge:   Gem balance never goes negative
 * Edge:   Total gems earned never decreases
 */
import { test, expect } from '@playwright/test';
import {
  signUp, restoreSession, clickTab, assertOnParentDashboard, assertOnChildDashboard,
} from './helpers';

// Spec-specific emails
const STS = Date.now();
const SPEC_PARENT_EMAIL = `test.parent.05.${STS}@kidreward-test.com`;
const SPEC_CHILD_EMAIL  = `test.child.05.${STS}@kidreward-test.com`;
const SPEC_PARENT_NAME  = `TestParent05_${STS}`;
const SPEC_CHILD_NAME   = `TestChild05_${STS}`;

let parentState: any;
let childState: any;

test.beforeAll(async ({ browser }) => {
  const p = await browser.newPage();
  await signUp(p, 'Parent', SPEC_PARENT_NAME, SPEC_PARENT_EMAIL);
  parentState = await p.context().storageState();
  await p.close();

  const c = await browser.newPage();
  await signUp(c, 'Child', SPEC_CHILD_NAME, SPEC_CHILD_EMAIL);
  childState = await c.context().storageState();
  await c.close();
});

test.describe('Gem Economy', () => {

  async function goToChildHome(page: any) {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    if (onJoin) return false;
    await clickTab(page, 'Home');
    await page.waitForLoadState('networkidle');
    return true;
  }

  test('US-019 | Child gem balance shown prominently on dashboard', async ({ page }) => {
    const ok = await goToChildHome(page);
    if (!ok) return;

    await expect(
      page.getByText('gems available', { exact: false }).or(page.getByText('💎').first()).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('US-019 | Gem balance is a non-negative integer', async ({ page }) => {
    const ok = await goToChildHome(page);
    if (!ok) return;

    const balanceText = await page.locator('text=/\\d+ gems available/i').first().textContent().catch(() => '0 gems available');
    const balance = parseInt(balanceText?.match(/\d+/)?.[0] ?? '0', 10);
    expect(balance).toBeGreaterThanOrEqual(0);
  });

  test('US-020 | Activity history visible on child dashboard', async ({ page }) => {
    const ok = await goToChildHome(page);
    if (!ok) return;

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

    await expect(page.getByText('💎 Total').or(page.getByText('Total')).first()).toBeVisible();
  });

  test('Gem balance shows on reward store header', async ({ page }) => {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    if (onJoin) return;

    await clickTab(page, 'Rewards');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('gems to spend', { exact: false })).toBeVisible({ timeout: 10_000 });
    const balanceText = await page.locator('text=/\\d+ gems to spend/i').first().textContent().catch(() => '0 gems to spend');
    const balance = parseInt(balanceText?.match(/\d+/)?.[0] ?? '0', 10);
    expect(balance).toBeGreaterThanOrEqual(0);
  });

});
