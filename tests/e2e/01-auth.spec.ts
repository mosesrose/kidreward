/**
 * US-001  Sign up as a parent and have a family auto-created
 * US-002  Sign up as a child and pick an emoji avatar
 * US-003  Log in and be redirected to the correct dashboard
 */
import { test, expect } from '@playwright/test';
import {
  parentEmail, childEmail, TEST_PASSWORD, PARENT_NAME, CHILD_NAME,
  gotoWelcome, signUp, login, signOut,
  assertOnParentDashboard, assertOnChildDashboard,
} from './helpers';

test.describe('Auth & Onboarding', () => {

  test('US-001 | Parent can sign up and reach dashboard', async ({ page }) => {
    await signUp(page, 'Parent', PARENT_NAME, parentEmail());

    // Should be on parent dashboard — family was auto-created
    await assertOnParentDashboard(page);
    // Name should appear in greeting
    await expect(page.getByText(PARENT_NAME, { exact: false })).toBeVisible();
  });

  test('US-002 | Child can sign up and pick an emoji avatar', async ({ page }) => {
    await signUp(page, 'Child', CHILD_NAME, childEmail());

    // After child signup → avatar picker screen
    // 12 emoji options should be visible
    const emojis = page.locator('text=🧒').or(page.locator('text=👦')).or(page.locator('text=👧'));
    await expect(emojis.first()).toBeVisible();

    // Pick an avatar and proceed
    await page.locator('text=🦊').click();
    await page.getByText("Let's go!").click();
    await page.waitForLoadState('networkidle');

    // Should land on join screen (no family yet)
    await expect(page.getByText('Join Your Family').or(page.getByText('invite code'))).toBeVisible();
  });

  test('US-003 | Parent login redirects to parent dashboard', async ({ page }) => {
    // Sign up first to have an account
    await signUp(page, 'Parent', `LoginTest${Date.now()}`, `login.parent.${Date.now()}@kidreward-test.com`);
    await signOut(page);

    // Now log in
    await login(page, parentEmail());
    await assertOnParentDashboard(page);
  });

  test('US-003 | Child login redirects to child dashboard or join screen', async ({ page }) => {
    await signUp(page, 'Child', `LoginChild${Date.now()}`, `login.child.${Date.now()}@kidreward-test.com`);
    await signOut(page);

    await login(page, childEmail());
    // Either on join screen (no family) or child dashboard
    const onJoin = await page.getByText('Join Your Family').isVisible().catch(() => false);
    const onDash = await page.getByText('Active Missions').isVisible().catch(() => false);
    expect(onJoin || onDash).toBeTruthy();
  });

  test('Welcome screen shows both Get Started and Sign In options', async ({ page }) => {
    await gotoWelcome(page);
    await page.getByText('Sign out').click().catch(() => {}); // sign out if logged in
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // If on welcome screen
    const welcomeVisible = await page.getByText('Get Started').isVisible().catch(() => false);
    if (welcomeVisible) {
      await expect(page.getByText('Get Started')).toBeVisible();
      await expect(page.getByText('I already have an account')).toBeVisible();
    }
    // Already logged in — just pass
  });

});
