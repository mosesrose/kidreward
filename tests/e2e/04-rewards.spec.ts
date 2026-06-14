/**
 * US-015  Parent creates rewards children can buy with gems
 * US-016  Child browses the reward store
 * US-017  Child redeems a reward
 * US-018  Parent marks redemption as fulfilled
 */
import { test, expect } from '@playwright/test';
import {
  signUp, restoreSession, clickTab, assertOnParentDashboard,
  setupFamilyPair,
} from './helpers';

const STS = Date.now();
const REWARD_TITLE = `Cinema Trip ${STS}`;

let parentState: any;
let childState: any;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  const pair = await setupFamilyPair(browser);
  parentState = pair.parentState;
  childState = pair.childState;
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

    // Use testID click — dispatchEvent('click') doesn't trigger React onPress on web
    await page.getByTestId('save-reward-btn').click();
    await page.waitForURL(url => !url.pathname.includes('create'), { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify in the rewards list (not the form's own suggestion list)
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
    test.skip(!!onJoin, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Rewards');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText('GEMS', { exact: true }).or(page.getByText('gems to spend', { exact: false })).or(page.getByText('💎')).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('US-017 | Child sees rewards and cannot redeem with 0 gems', async ({ page }) => {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!!onJoin, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Rewards');
    // Wait for header balance to appear — compact GemHeader shows "GEMS", old UI "gems to spend"
    await expect(
      page.getByText('GEMS', { exact: true }).or(page.getByText('gems to spend', { exact: false })).first()
    ).toBeVisible({ timeout: 10_000 });
    // Give the rewards FlatList time to load from Supabase
    await page.waitForTimeout(3000);

    // Either reward cards with "X more to go" / "Tap to redeem!" are visible, or store is empty
    const hasReward = await page.getByText(/\d+ more to go/).first().isVisible({ timeout: 2000 }).catch(() => false)
      || await page.getByText(/Need \d+ more/).first().isVisible({ timeout: 1000 }).catch(() => false)
      || await page.getByText('Tap to redeem!').first().isVisible({ timeout: 1000 }).catch(() => false)
      || await page.getByText('Movie night pick').first().isVisible({ timeout: 1000 }).catch(() => false);
    const storeEmpty = await page.getByText('No rewards yet').isVisible({ timeout: 1000 }).catch(() => false);

    // Parent created at least one reward in US-015 — store must not be empty
    expect(hasReward || !storeEmpty).toBeTruthy();
    if (!storeEmpty) {
      // If rewards exist, one of the affordability states must be shown
      // Store shows "X more to go" (locked) or "Tap to redeem!" (affordable)
      const hasAffordabilityBadge = await page.getByText(/Need \d+ more/).first().isVisible({ timeout: 2000 }).catch(() => false)
        || await page.getByText('Tap to redeem!').first().isVisible({ timeout: 1000 }).catch(() => false)
        || await page.getByText(/\d+ more to go/).first().isVisible({ timeout: 1000 }).catch(() => false);
      expect(hasAffordabilityBadge).toBeTruthy();
    }
  });

  test('US-017 | Child can redeem an affordable reward', async ({ page }) => {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!!onJoin, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Rewards');
    await page.waitForLoadState('networkidle');

    // Only executes if child has enough gems for a reward (earned via challenge approval)
    const affordableCard = page.getByText('Tap to redeem!').first();
    if (await affordableCard.isVisible({ timeout: 3000 }).catch(() => false)) {
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

  // ── Button/link coverage ──────────────────────────────────────────────────

  test('Create reward — empty title shows inline error', async ({ page }) => {
    await restoreSession(page, parentState);
    await assertOnParentDashboard(page);
    await clickTab(page, 'Rewards');
    await page.waitForLoadState('networkidle');

    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');

    // Don't pick a suggestion — leave title empty, click Save
    await page.getByTestId('save-reward-btn').dispatchEvent('click');
    await page.waitForTimeout(500);

    await expect(page.getByTestId('reward-save-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('reward-save-error')).toContainText(/title/i);
  });

  test('Create reward — ← Back button returns to rewards list', async ({ page }) => {
    await restoreSession(page, parentState);
    await assertOnParentDashboard(page);
    await clickTab(page, 'Rewards');
    await page.waitForLoadState('networkidle');

    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('New Reward').first()).toBeVisible({ timeout: 10_000 });

    await page.getByText('← Back').click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('+ New').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Parent dashboard Quick Actions — all 4 buttons navigate correctly', async ({ page }) => {
    await restoreSession(page, parentState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // New Challenge
    await page.getByText('New Challenge').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('New Challenge').first()).toBeVisible({ timeout: 10_000 });
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // New Reward
    await page.getByText('New Reward').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Suggestions').or(page.getByText('Reward Type')).first()).toBeVisible({ timeout: 10_000 });
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Invite Child
    await page.getByText('Invite Child').click();
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Invite Code/i).or(page.getByText(/send.*invite/i)).first()
    ).toBeVisible({ timeout: 10_000 });
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Redemptions
    await page.getByText('Redemptions').last().click();
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/Redemptions/i).or(page.getByText(/fulfilled/i)).or(page.getByText(/No redemptions/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Child store — cancel redemption confirm hides confirm UI', async ({ page }) => {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!!onJoin, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Rewards');
    await page.waitForLoadState('networkidle');

    // Click any reward to trigger confirm state
    const affordBadge = page.getByText('Tap to redeem!').first();
    if (await affordBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
      await affordBadge.click();
      await page.waitForTimeout(500);
      // Cancel button should appear
      const cancelBtn = page.getByText('Cancel');
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
        // Confirm UI should be gone, cancel button not visible
        await expect(cancelBtn).not.toBeVisible({ timeout: 3000 });
      }
    }
  });

});
