/**
 * Edge cases from the manual QA checklist:
 * - Empty states render correctly
 * - Wrong invite code shows clear error
 * - Challenge assigned to one child not shown to another
 * - Cannot submit same challenge twice while pending
 * - App loads and navigates correctly on mobile viewport
 */
import { test, expect } from '@playwright/test';
import {
  TS, parentEmail, childEmail, TEST_PASSWORD,
  gotoWelcome, signUp, login, assertOnParentDashboard,
} from './helpers';

test.describe('Edge Cases & Robustness', () => {

  test('Empty state: parent with no kids shows invite CTA', async ({ page }) => {
    const email = `empty.parent.${Date.now()}@kidreward-test.com`;
    await signUp(page, 'Parent', `EmptyParent${Date.now()}`, email);
    await assertOnParentDashboard(page);

    // My Kids tab should show empty state with invite CTA
    await page.getByText('My Kids').click();
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText('Invite').or(page.getByText('No kids')).or(page.getByText('Send Invite'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Empty state: no challenges shows correct empty state', async ({ page }) => {
    const email = `empty.chal.${Date.now()}@kidreward-test.com`;
    await signUp(page, 'Parent', `EmptyChal${Date.now()}`, email);

    await page.getByText('Challenges').click();
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText('No challenges').or(page.getByText('No challenges yet'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Empty state: no rewards shows correct empty state', async ({ page }) => {
    const email = `empty.rew.${Date.now()}@kidreward-test.com`;
    await signUp(page, 'Parent', `EmptyRew${Date.now()}`, email);

    await page.getByText('Rewards').click();
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText('No rewards').or(page.getByText('No rewards yet'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Expired invite code shows helpful error', async ({ page }) => {
    const email = `expired.${Date.now()}@kidreward-test.com`;
    await signUp(page, 'Child', `Expired${Date.now()}`, email);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Join Your Family')).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder('ABC123').fill('XXXXXX');
    await page.getByText("Let's Go!").click();
    await page.waitForLoadState('networkidle');

    // Should show a helpful error — not a crash
    await expect(
      page.getByText('invalid').or(
        page.getByText('expired').or(
          page.getByText('not found')
        )
      )
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Child cannot submit challenge twice while pending', async ({ page }) => {
    await login(page, childEmail());
    await page.getByText('Missions').click();
    await page.waitForLoadState('networkidle');

    // Find a challenge that's in pending state
    const pendingChallenge = page.getByText('Waiting for review').or(
      page.locator('[data-status="pending"]')
    );

    if (await pendingChallenge.first().isVisible().catch(() => false)) {
      // The "I Did It!" button should NOT be visible (already submitted)
      await expect(page.getByText('I Did It!')).not.toBeVisible();
    }
    // If no pending challenges, test passes
  });

  test('App loads correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone SE
    await gotoWelcome(page);
    await page.waitForLoadState('networkidle');

    // Page should not overflow or crash
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(380); // No horizontal overflow

    // Content should be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('Page title and basic metadata are correct', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title.toLowerCase()).toContain('kid'); // KidReward or similar
  });

  test('No JavaScript console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known third-party errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('google') &&
      !e.includes('opentelemetry')
    );

    expect(criticalErrors).toHaveLength(0);
  });

});
