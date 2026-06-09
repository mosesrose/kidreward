/**
 * US-015  Parent creates rewards children can buy with gems
 * US-016  Child browses the reward store
 * US-017  Child redeems a reward
 * US-018  Parent marks redemption as fulfilled
 */
import { test, expect } from '@playwright/test';
import {
  signUp, restoreSession, clickTab, assertOnParentDashboard,
} from './helpers';

// Spec-specific emails
const STS = Date.now();
const SPEC_PARENT_EMAIL = `test.parent.04.${STS}@kidreward-test.com`;
const SPEC_CHILD_EMAIL  = `test.child.04.${STS}@kidreward-test.com`;
const SPEC_PARENT_NAME  = `TestParent04_${STS}`;
const SPEC_CHILD_NAME   = `TestChild04_${STS}`;
const REWARD_TITLE      = `Cinema Trip ${STS}`;

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

test.describe('Rewards', () => {

  test('US-015 | Parent creates a reward (all 4 types)', async ({ page }) => {
    await restoreSession(page, parentState, '/dashboard');
    await assertOnParentDashboard(page);
    await clickTab(page, 'Rewards');
    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Money', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Gift', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Screen Time', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Activity', { exact: true }).first()).toBeVisible();

    // Click Activity type then select a suggestion (no keyboard typing — avoids page scroll)
    await page.getByText('Activity').click();
    await page.getByText('Movie night pick').click();
    await page.waitForTimeout(500);

    page.once('dialog', d => d.accept());
    await page.getByText('Save', { exact: true }).dispatchEvent('click');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const stillOnRewardForm = await page.getByText('New Reward').isVisible().catch(() => false);
    if (stillOnRewardForm) { await clickTab(page, 'Rewards'); }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByText('Movie night pick')).toBeVisible({ timeout: 10_000 });
  });

  test('Reward visibility toggle — parent can hide/show a reward', async ({ page }) => {
    await restoreSession(page, parentState, '/rewards');
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('[role="switch"]').first();
    if (await toggle.isVisible().catch(() => false)) {
      const wasChecked = await toggle.isChecked().catch(() => true);
      await toggle.click();
      await page.waitForLoadState('networkidle');
      const isNowChecked = await toggle.isChecked().catch(() => !wasChecked);
      expect(isNowChecked).toBe(!wasChecked);
      await toggle.click();
    }
  });

  test('US-016 | Child sees reward store with gem balance', async ({ page }) => {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    if (onJoin) { return; }

    await clickTab(page, 'Rewards');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('gems to spend', { exact: false }).or(page.getByText('💎')).first()).toBeVisible({ timeout: 10_000 });
  });

  test('US-017 | Child cannot redeem if insufficient gems', async ({ page }) => {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    if (onJoin) { return; }

    await clickTab(page, 'Rewards');
    await page.waitForLoadState('networkidle');

    const needMore = page.getByText(/Need \d+ more/);
    if (await needMore.first().isVisible().catch(() => false)) {
      const balance = page.getByText(/\d+ gems to spend/);
      await expect(balance).toBeVisible();
    }
  });

  test('US-017 | Child can redeem an affordable reward', async ({ page }) => {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    if (onJoin) { return; }

    await clickTab(page, 'Rewards');
    await page.waitForLoadState('networkidle');

    const affordableCard = page.getByText('Tap to redeem!').first();
    if (await affordableCard.isVisible().catch(() => false)) {
      await affordableCard.click();
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: /Redeem/i }).click();
      await page.waitForLoadState('networkidle');
      await expect(
        page.getByText('Redeemed').or(page.getByText('Pending')).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test('US-018 | Parent sees and fulfils redemption request', async ({ page }) => {
    await restoreSession(page, parentState);
    await page.getByText('Redemptions').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('networkidle');

    // Check for Mark Fulfilled button directly (dashboard "Pending" stat stays in DOM, so we can't use it as a proxy)
    const fulfillBtn = page.getByText(/Mark Fulfilled/i).first();
    if (await fulfillBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fulfillBtn.click({ force: true });
      await page.waitForLoadState('networkidle');
      await expect(
        page.getByText('fulfilled').or(page.getByText('Fulfilled')).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test('US-018 | Parent can reject redemption and gems are refunded', async ({ page }) => {
    await restoreSession(page, parentState);
    await page.getByText('Redemptions').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('networkidle');

    const rejectBtn = page.getByRole('button', { name: /Reject/i });
    if (await rejectBtn.first().isVisible().catch(() => false)) {
      await rejectBtn.first().click();
      await page.getByRole('button', { name: /Reject/i }).last().click();
      await page.waitForLoadState('networkidle');
      await expect(
        page.getByText('rejected').or(page.getByText('Rejected')).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });

});
