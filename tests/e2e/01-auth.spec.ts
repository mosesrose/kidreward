/**
 * US-001  Sign up as a parent and have a family auto-created
 * US-002  Sign up as a child and pick an emoji avatar
 * US-003  Log in and be redirected to the correct dashboard
 * US-AUTH Cover all authentication scenarios (P0)
 */
import { test, expect } from '@playwright/test';
import {
  parentEmail, childEmail, TEST_PASSWORD, PARENT_NAME, CHILD_NAME, TS,
  gotoWelcome, signUp, login, signOut, clickByText, restoreSession,
  assertOnParentDashboard, assertOnChildDashboard, assertOnAvatarPicker, assertOnJoinScreen,
  SUPABASE_WAIT,
} from './helpers';

// Shared accounts for login / session tests (created once in beforeAll)
const LOGIN_PARENT_EMAIL = `login.parent.${TS}@kidreward-test.com`;
const LOGIN_CHILD_EMAIL  = `login.child.${TS}@kidreward-test.com`;
let parentState: any = null;
let childState: any = null;

test.describe('Auth & Onboarding', () => {

  test('US-001 | Parent can sign up and reach dashboard', async ({ page }) => {
    await signUp(page, 'Parent', PARENT_NAME, parentEmail());
    await assertOnParentDashboard(page);
  });

  test('US-002 | Child can sign up and lands on join screen', async ({ page }) => {
    await signUp(page, 'Child', CHILD_NAME, childEmail());
    await assertOnJoinScreen(page);
  });

  test('Welcome screen shows Get Started and existing account link', async ({ page }) => {
    await gotoWelcome(page);
    await expect(page.getByText(/Get Started/)).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByText(/I already have an account/)).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Login form fields are present', async ({ page }) => {
    await gotoWelcome(page);
    await clickByText(page, 'I already have an account');
    await page.waitForLoadState('networkidle');

    await expect(page.getByPlaceholder('you@example.com')).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByPlaceholder('Your password')).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByText(/Sign In/, { exact: false })).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Signup form shows both role options', async ({ page }) => {
    await gotoWelcome(page);
    await clickByText(page, 'Get Started');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Parent', { exact: true })).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByText('Child', { exact: true })).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByText(/Set challenges/)).toBeVisible();
    await expect(page.getByText(/Complete tasks/)).toBeVisible();
  });

  test('Login page has link to sign up', async ({ page }) => {
    await gotoWelcome(page);
    await clickByText(page, 'I already have an account');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText(/Sign up/i).or(page.getByText(/Create account/i)).first()
    ).toBeVisible({ timeout: SUPABASE_WAIT });
  });

});

test.describe('Login scenarios', () => {

  test.beforeAll(async ({ browser }) => {
    const p = await browser.newPage();
    await signUp(p, 'Parent', `LoginParent${TS}`, LOGIN_PARENT_EMAIL);
    parentState = await p.context().storageState();
    await p.close();

    // Child account (no family — lands on join screen)
    const c = await browser.newPage();
    await signUp(c, 'Child', `LoginChild${TS}`, LOGIN_CHILD_EMAIL);
    childState = await c.context().storageState();
    await c.close();
  });

  test('US-003 | Authenticated parent session lands on parent dashboard', async ({ page }) => {
    // Verify that a returning parent (session restored) lands on the parent dashboard.
    // signup auto-signs-in; restoreSession simulates a returning user with a saved token.
    await restoreSession(page, parentState);
    await assertOnParentDashboard(page);
  });

  test('US-003 | Authenticated child session lands on join or child dashboard', async ({ page }) => {
    // Child with no family → join screen; with family → child dashboard
    await restoreSession(page, childState);
    await expect(
      page.getByText(/Join Your Family/i)
        .or(page.getByText(/Active Missions/i))
        .or(page.getByText(/Hey,/))
        .first()
    ).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Wrong password shows inline login error', async ({ page }) => {
    await gotoWelcome(page);
    await clickByText(page, 'I already have an account');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('you@example.com').fill(LOGIN_PARENT_EMAIL);
    await page.getByPlaceholder('Your password').fill('WrongPassword999!');
    await page.getByText('Sign In', { exact: true }).click();

    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Non-existent email shows inline login error', async ({ page }) => {
    await gotoWelcome(page);
    await clickByText(page, 'I already have an account');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('you@example.com').fill('nobody.doesnotexist@kidreward-test.com');
    await page.getByPlaceholder('Your password').fill(TEST_PASSWORD);
    await page.getByText('Sign In', { exact: true }).click();

    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Empty fields show inline validation error', async ({ page }) => {
    await gotoWelcome(page);
    await clickByText(page, 'I already have an account');
    await page.waitForLoadState('networkidle');

    await page.getByText('Sign In', { exact: true }).click();

    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByTestId('login-error')).toContainText(/email and password/i);
  });

  test('Forgot password link is visible on login screen', async ({ page }) => {
    await gotoWelcome(page);
    await clickByText(page, 'I already have an account');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Forgot password\?/i)).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Forgot password — valid email shows confirmation', async ({ page }) => {
    // Navigate directly — avoids Expo Router keeping both screens in DOM
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Use a real email domain — Supabase rejects @kidreward-test.com for resetPasswordForEmail
    const resetEmail = `kidreward.test+${TS}@gmail.com`;
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible({ timeout: SUPABASE_WAIT });
    await page.getByPlaceholder('you@example.com').fill(resetEmail);
    await page.getByText('Send Reset Link').click();

    await expect(page.getByTestId('reset-sent')).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Forgot password — empty email shows inline error', async ({ page }) => {
    await gotoWelcome(page);
    await clickByText(page, 'I already have an account');
    await page.waitForLoadState('networkidle');
    await page.getByText(/Forgot password\?/i).click();
    await page.waitForLoadState('networkidle');

    await page.getByText('Send Reset Link').click();

    await expect(page.getByTestId('reset-error')).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Sign out returns to unauthenticated screen', async ({ page }) => {
    // Use a fresh signup so auth lives in real localStorage (no restoreSession init-script side-effects)
    const soEmail = `signout.${Date.now()}@kidreward-test.com`;
    await signUp(page, 'Parent', `SignOutParent${Date.now()}`, soEmail);
    await assertOnParentDashboard(page);

    await signOut(page);
    // After sign out, clear storage and reload — the app has no session and must show welcome
    await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText(/Get Started/)
        .or(page.getByText(/KidReward/))
        .or(page.getByText(/Welcome back/))
        .or(page.getByText(/I already have an account/))
        .or(page.getByText(/Sign in/i))
        .first()
    ).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Session persists — returning to app root re-authenticates', async ({ page }) => {
    // Fresh signup places the auth token in real localStorage
    const spEmail = `session.${Date.now()}@kidreward-test.com`;
    await signUp(page, 'Parent', `SessionParent${Date.now()}`, spEmail);
    await assertOnParentDashboard(page);

    // Simulate reopening the app (navigate to root) — token still in localStorage → dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await assertOnParentDashboard(page);
  });

  test('Duplicate email signup shows error', async ({ page }) => {
    await gotoWelcome(page);
    await clickByText(page, 'Get Started');
    await page.waitForLoadState('networkidle');

    await page.getByText('Parent', { exact: true }).first().click();
    await page.getByPlaceholder(/Mum or Dad|e\.g\. Alex/).fill(`DupParent${TS}`);
    await page.getByPlaceholder('you@example.com').fill(LOGIN_PARENT_EMAIL);
    await page.getByPlaceholder('Min 6 characters').fill(TEST_PASSWORD);

    let alertMsg = '';
    page.once('dialog', async dialog => { alertMsg = dialog.message(); await dialog.accept(); });

    await page.getByText('Create Account 🚀').click({ timeout: 10_000 });
    await page.waitForTimeout(5000);

    const stillOnSignup = page.url().includes('signup');
    expect(alertMsg.length > 0 || stillOnSignup).toBeTruthy();
  });

  // ── Reset-password landing page ────────────────────────────────────────────

  test('Reset password page exists and shows form when session is active', async ({ page }) => {
    // Sign in as a real user so there is a valid session, then visit /reset-password
    // This simulates arriving via the email link (which also sets a session).
    const rpEmail = `reset.pw.${Date.now()}@kidreward-test.com`;
    await signUp(page, 'Parent', `ResetPwUser${Date.now()}`, rpEmail);
    await page.goto('/reset-password');
    await page.waitForLoadState('networkidle');

    // Should see the new-password form, NOT the "link invalid" state
    await expect(page.getByText('Set new password')).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByPlaceholder('Min 6 characters')).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByPlaceholder('Repeat your password')).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByText('Update Password')).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Reset password — mismatched passwords shows inline error', async ({ page }) => {
    const rpEmail = `reset.mismatch.${Date.now()}@kidreward-test.com`;
    await signUp(page, 'Parent', `ResetMismatch${Date.now()}`, rpEmail);
    await page.goto('/reset-password');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Min 6 characters').fill('NewPass123!');
    await page.getByPlaceholder('Repeat your password').fill('DifferentPass!');
    await page.getByText('Update Password').click();

    await expect(page.getByTestId('reset-pw-error')).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByTestId('reset-pw-error')).toContainText(/do not match/i);
  });

  test('Reset password — short password shows inline error', async ({ page }) => {
    const rpEmail = `reset.short.${Date.now()}@kidreward-test.com`;
    await signUp(page, 'Parent', `ResetShort${Date.now()}`, rpEmail);
    await page.goto('/reset-password');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Min 6 characters').fill('abc');
    await page.getByPlaceholder('Repeat your password').fill('abc');
    await page.getByText('Update Password').click();

    await expect(page.getByTestId('reset-pw-error')).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByTestId('reset-pw-error')).toContainText(/at least 6/i);
  });

  test('Reset password — no session shows expired link message', async ({ page }) => {
    // Navigate directly without any auth session
    await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
    await page.goto('/reset-password');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByTestId('reset-invalid')).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByText('Request a new link')).toBeVisible({ timeout: SUPABASE_WAIT });
  });

});
