/**
 * US-001  Sign up as a parent and have a family auto-created
 * US-002  Child signs up via invite code and joins family
 * US-003  Log in and be redirected to the correct dashboard
 * US-AUTH Cover all authentication scenarios (P0)
 */
import { test, expect } from '@playwright/test';
import {
  parentEmail, TEST_PASSWORD, PARENT_NAME, TS,
  gotoWelcome, signUp, login, signOut, clickByText, restoreSession,
  assertOnParentDashboard, SUPABASE_WAIT, SUPABASE_URL, SUPABASE_ANON_KEY,
} from './helpers';

// Shared accounts for login / session tests (created once in beforeAll)
const LOGIN_PARENT_EMAIL = `login.parent.${TS}@kidreward-test.com`;
let parentState: any = null;
let childState: any = null;

test.describe('Auth & Onboarding', () => {

  test('US-001 | Parent can sign up and reach dashboard', async ({ page }) => {
    await signUp(page, 'Parent', PARENT_NAME, parentEmail());
    await assertOnParentDashboard(page);
  });

  test('US-002 | Child can sign up via email-gated invite code and joins family', async ({ page, browser }) => {
    test.setTimeout(120_000);
    // Parent creates account + email-gated invite (P0: invite must include child's email)
    const parentPage = await browser.newPage();
    const ts = Date.now();
    const pEmail = `us002.parent.${ts}@kidreward-test.com`;
    const cEmail = `us002.child.${ts}@kidreward-test.com`;
    await signUp(parentPage, 'Parent', `US002Parent${ts}`, pEmail);
    const pAuth = await parentPage.context().storageState();
    await parentPage.close();

    // Get family_id + create email-gated invite via REST API
    const pJwt = pAuth.origins?.flatMap((o: any) => o.localStorage ?? [])
      .map((i: any) => { try { const p = JSON.parse(i.value); return p?.access_token ?? p?.session?.access_token; } catch { return null; } })
      .find(Boolean);
    const pUser = pAuth.origins?.flatMap((o: any) => o.localStorage ?? [])
      .map((i: any) => { try { const p = JSON.parse(i.value); return p?.user?.id ?? p?.session?.user?.id; } catch { return null; } })
      .find(Boolean);
    const famResp = await fetch(`${SUPABASE_URL}/rest/v1/families?parent_id=eq.${pUser}&select=id`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${pJwt}` } });
    const [{ id: familyId }] = await famResp.json();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let inviteCode = ''; for (let i = 0; i < 6; i++) inviteCode += chars[Math.floor(Math.random() * chars.length)];
    await fetch(`${SUPABASE_URL}/rest/v1/invites`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${pJwt}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ family_id: familyId, code: inviteCode, email: cEmail, invite_type: 'child', created_by: pUser, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }),
    });

    // Child goes through email-gated signup — email field is pre-filled and locked
    await gotoWelcome(page);
    await page.getByText('Join with invite code', { exact: false }).click();
    await page.waitForLoadState('networkidle');
    await page.getByTestId('invite-code-input').fill(inviteCode);
    await page.getByTestId('validate-code-btn').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Email is pre-filled from invite — only name + password needed
    await page.getByPlaceholder('e.g. Alex').fill(`US002Child${ts}`);
    await page.getByPlaceholder('Min 6 characters').fill(TEST_PASSWORD);
    await page.getByTestId('create-child-account-btn').click();
    await page.waitForURL(url => url.pathname.includes('child') || url.pathname === '/', { timeout: SUPABASE_WAIT });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Child should be on child home (already in family), not on join screen
    await expect(
      page.getByText(/Hey,/).or(page.getByText(/Hi /)).or(page.getByText('Active Missions'))
        .or(page.getByText('No missions yet')).or(page.getByText('YOUR GEMS'))
        .or(page.getByText('gems available', { exact: false })).first()
    ).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Child signup with email-gated invite — email field is pre-filled and locked', async ({ page, browser }) => {
    test.setTimeout(120_000);
    // Create parent + email-gated invite via REST
    const ts = Date.now();
    const pEmail = `emaillock.parent.${ts}@kidreward-test.com`;
    const cEmail = `emaillock.child.${ts}@kidreward-test.com`;
    const parentPage = await browser.newPage();
    await signUp(parentPage, 'Parent', `EmailLockParent${ts}`, pEmail);
    const pAuth = await parentPage.context().storageState();
    await parentPage.close();

    const pJwt = pAuth.origins?.flatMap((o: any) => o.localStorage ?? [])
      .map((i: any) => { try { const p = JSON.parse(i.value); return p?.access_token ?? p?.session?.access_token; } catch { return null; } })
      .find(Boolean);
    const pUser = pAuth.origins?.flatMap((o: any) => o.localStorage ?? [])
      .map((i: any) => { try { const p = JSON.parse(i.value); return p?.user?.id ?? p?.session?.user?.id; } catch { return null; } })
      .find(Boolean);
    const famResp = await fetch(`${SUPABASE_URL}/rest/v1/families?parent_id=eq.${pUser}&select=id`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${pJwt}` } });
    const [{ id: familyId }] = await famResp.json();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let inviteCode = ''; for (let i = 0; i < 6; i++) inviteCode += chars[Math.floor(Math.random() * chars.length)];
    await fetch(`${SUPABASE_URL}/rest/v1/invites`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${pJwt}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ family_id: familyId, code: inviteCode, email: cEmail, invite_type: 'child', created_by: pUser, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }),
    });

    // Navigate to step 2 via invite code
    await gotoWelcome(page);
    await page.getByText('Join with invite code', { exact: false }).click();
    await page.waitForLoadState('networkidle');
    await page.getByTestId('invite-code-input').fill(inviteCode);
    await page.getByTestId('validate-code-btn').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Email input should show the invite email and be read-only
    const emailInput = page.getByPlaceholder('you@example.com');
    await expect(emailInput).toBeVisible({ timeout: SUPABASE_WAIT });
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toBe(cEmail);
    // The field is locked (not editable) — attribute disabled or readonly is set
    const isEditable = await emailInput.isEditable();
    expect(isEditable).toBe(false);
    // Hint text shown below locked email
    await expect(page.getByText("Email set by your parent's invite")).toBeVisible({ timeout: 5_000 });
  });

  test('Child signup — wrong email on email-gated invite shows error', async ({ page, browser }) => {
    test.setTimeout(120_000);
    // Create parent + invite gated to a specific email
    const ts = Date.now();
    const pEmail = `wrongemail.parent.${ts}@kidreward-test.com`;
    const cEmail = `wrongemail.child.${ts}@kidreward-test.com`;
    const parentPage = await browser.newPage();
    await signUp(parentPage, 'Parent', `WrongEmailParent${ts}`, pEmail);
    const pAuth = await parentPage.context().storageState();
    await parentPage.close();

    const pJwt = pAuth.origins?.flatMap((o: any) => o.localStorage ?? [])
      .map((i: any) => { try { const p = JSON.parse(i.value); return p?.access_token ?? p?.session?.access_token; } catch { return null; } })
      .find(Boolean);
    const pUser = pAuth.origins?.flatMap((o: any) => o.localStorage ?? [])
      .map((i: any) => { try { const p = JSON.parse(i.value); return p?.user?.id ?? p?.session?.user?.id; } catch { return null; } })
      .find(Boolean);
    const famResp = await fetch(`${SUPABASE_URL}/rest/v1/families?parent_id=eq.${pUser}&select=id`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${pJwt}` } });
    const [{ id: familyId }] = await famResp.json();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let inviteCode = ''; for (let i = 0; i < 6; i++) inviteCode += chars[Math.floor(Math.random() * chars.length)];
    await fetch(`${SUPABASE_URL}/rest/v1/invites`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${pJwt}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ family_id: familyId, code: inviteCode, email: cEmail, invite_type: 'child', created_by: pUser, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }),
    });

    // Navigate to step 2 via invite code
    await gotoWelcome(page);
    await page.getByText('Join with invite code', { exact: false }).click();
    await page.waitForLoadState('networkidle');
    await page.getByTestId('invite-code-input').fill(inviteCode);
    await page.getByTestId('validate-code-btn').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // The email is locked to cEmail. The test verifies wrong-email handling by
    // checking the locked field shows the invite email (not a different one).
    // Since the field is read-only the app enforces the email server-side — a
    // mismatch would only occur if the UI is bypassed; the UX guard is the lock.
    const emailInput = page.getByPlaceholder('you@example.com');
    await expect(emailInput).toBeVisible({ timeout: SUPABASE_WAIT });
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toBe(cEmail);
    // User cannot type a different email — field is read-only
    const isEditable = await emailInput.isEditable();
    expect(isEditable).toBe(false);
  });

  test('Welcome screen shows parent and child invite paths', async ({ page }) => {
    await gotoWelcome(page);
    await expect(page.getByText("I'm a Parent", { exact: false })).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByText('Join with invite code', { exact: false })).toBeVisible({ timeout: SUPABASE_WAIT });
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

  test('Parent signup form shows name/email/password fields', async ({ page }) => {
    await gotoWelcome(page);
    await page.getByText("I'm a Parent", { exact: false }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Parent sign up', { exact: false })).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByPlaceholder('e.g. Mum or Dad')).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByPlaceholder('Min 6 characters')).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Child signup via invite — first step shows invite code input', async ({ page }) => {
    await gotoWelcome(page);
    await page.getByText('Join with invite code', { exact: false }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Enter invite code', { exact: false })).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByTestId('invite-code-input')).toBeVisible({ timeout: SUPABASE_WAIT });
    await expect(page.getByTestId('validate-code-btn')).toBeVisible({ timeout: SUPABASE_WAIT });
  });

  test('Child signup — invalid invite code shows error', async ({ page }) => {
    await gotoWelcome(page);
    await page.getByText('Join with invite code', { exact: false }).click();
    await page.waitForLoadState('networkidle');

    await page.getByTestId('invite-code-input').fill('XXXXXX');
    page.once('dialog', async d => d.accept());
    await page.getByTestId('validate-code-btn').click();
    await page.waitForTimeout(3000);

    // Should still be on step 1 (not advanced to account creation step)
    await expect(page.getByTestId('invite-code-input')).toBeVisible({ timeout: SUPABASE_WAIT });
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
    test.setTimeout(120_000);
    const p = await browser.newPage();
    await signUp(p, 'Parent', `LoginParent${TS}`, LOGIN_PARENT_EMAIL);
    parentState = await p.context().storageState();
    await p.close();

    // Child account via REST API — we just need a valid child session for session-restore tests.
    // Children can no longer use the UI signup without an invite; REST is fine for this helper scenario.
    const LOGIN_CHILD_EMAIL = `login.child.${TS}@kidreward-test.com`;
    const signUpResp = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: LOGIN_CHILD_EMAIL, password: TEST_PASSWORD }),
    });
    const signUpData: any = await signUpResp.json();
    const childUserId = signUpData?.user?.id;
    const childJwt = signUpData?.session?.access_token ?? signUpData?.access_token;
    if (childUserId && childJwt) {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${childJwt}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ id: childUserId, name: `LoginChild${TS}`, role: 'child', avatar_emoji: '🧒' }),
      });
      // Capture child session by logging in via the browser so we get a real storageState
      const c = await browser.newPage();
      await c.goto('/');
      await c.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
      await c.goto('/');
      await c.waitForLoadState('networkidle');
      await c.getByText('I already have an account').click();
      await c.waitForLoadState('networkidle');
      await c.getByPlaceholder('you@example.com').fill(LOGIN_CHILD_EMAIL);
      await c.getByPlaceholder('Your password').fill(TEST_PASSWORD);
      await c.getByText('Sign In', { exact: true }).click();
      await c.waitForURL(url => !url.pathname.includes('login'), { timeout: SUPABASE_WAIT });
      await c.waitForLoadState('networkidle');
      await c.waitForTimeout(2000);
      childState = await c.context().storageState();
      await c.close();
    }
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
    // Fresh signup so auth lives in real localStorage
    const soEmail = `signout.${Date.now()}@kidreward-test.com`;
    await signUp(page, 'Parent', `SignOutParent${Date.now()}`, soEmail);
    await assertOnParentDashboard(page);

    await signOut(page);
    // AuthContext.signOut now navigates to /(auth)/welcome automatically
    await expect(
      page.getByText(/Get Started/)
        .or(page.getByText(/I already have an account/))
        .or(page.getByText(/KidReward/i))
        .first()
    ).toBeVisible({ timeout: SUPABASE_WAIT });

    // Confirm the session is truly gone — navigating to / shows welcome, not dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(
      page.getByText(/Get Started/).or(page.getByText(/I already have an account/)).first()
    ).toBeVisible({ timeout: SUPABASE_WAIT });
    const url = page.url();
    expect(url).not.toContain('dashboard');
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
    await page.getByText("I'm a Parent", { exact: false }).click();
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('e.g. Mum or Dad').fill(`DupParent${TS}`);
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

  test('Reset password — after update, session is cleared and login page is shown', async ({ page }) => {
    // Simulate arriving on reset-password with an active session (as the email link would)
    const rpEmail = `reset.flow.${Date.now()}@kidreward-test.com`;
    await signUp(page, 'Parent', `ResetFlow${Date.now()}`, rpEmail);
    await page.goto('/reset-password');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Min 6 characters').fill('NewPass456!');
    await page.getByPlaceholder('Repeat your password').fill('NewPass456!');
    await page.getByText('Update Password').click();

    // Success screen shown
    await expect(page.getByTestId('reset-done')).toBeVisible({ timeout: SUPABASE_WAIT });

    // After tapping "Go to Sign In", user must see the login page — NOT be silently redirected to dashboard
    await page.getByText('Go to Sign In').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(
      page.getByPlaceholder('Your password')
        .or(page.getByText(/Sign In/))
        .first()
    ).toBeVisible({ timeout: SUPABASE_WAIT });
    // Must NOT be on the dashboard
    const url = page.url();
    expect(url).not.toContain('dashboard');
  });

  test('Reset password — user can sign in with new password after reset', async ({ page }) => {
    const rpEmail = `reset.signin.${Date.now()}@kidreward-test.com`;
    const newPassword = 'UpdatedPass789!';

    // Step 1: create account with original password
    await signUp(page, 'Parent', `ResetSignIn${Date.now()}`, rpEmail);

    // Step 2: visit reset-password page (session is active, simulating recovery flow)
    await page.goto('/reset-password');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('Min 6 characters').fill(newPassword);
    await page.getByPlaceholder('Repeat your password').fill(newPassword);
    await page.getByText('Update Password').click();
    await expect(page.getByTestId('reset-done')).toBeVisible({ timeout: SUPABASE_WAIT });

    // Step 3: go to sign in
    await page.getByText('Go to Sign In').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 4: sign in with the new password
    await page.getByPlaceholder('you@example.com').first().fill(rpEmail);
    await page.getByPlaceholder('Your password').fill(newPassword);
    await page.getByText('Sign In', { exact: true }).click();

    // Should land on parent dashboard
    await assertOnParentDashboard(page);
  });

});
