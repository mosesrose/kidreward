import { Page, expect } from '@playwright/test';

// ── Unique test identifiers ───────────────────────────────────
export const TS = Date.now();

export function parentEmail() { return `test.parent.${TS}@kidreward-test.com`; }
export function childEmail()  { return `test.child.${TS}@kidreward-test.com`; }
export const TEST_PASSWORD = 'TestPass123!';
export const PARENT_NAME   = `TestParent${TS}`;
export const CHILD_NAME    = `TestChild${TS}`;

// Longer waits for Supabase-dependent transitions
export const SUPABASE_WAIT = 30_000;

// ── Robust click helper (emoji buttons, partial text) ─────────
export async function clickByText(page: Page, text: string, options: { timeout?: number } = {}) {
  const timeout = options.timeout ?? 15_000;
  const re = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  // Prefer role=button first, fall back to first visible element
  const btn = page.getByRole('button', { name: re });
  if (await btn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.first().click({ timeout });
  } else {
    await page.getByText(re).first().click({ timeout });
  }
}

// ── Click a tab by its label ──────────────────────────────────
export async function clickTab(page: Page, label: string) {
  // Expo Router tabs on web render as links in a tablist
  const tablist = page.locator('[role="tablist"]');
  if (await tablist.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tablist.getByText(label, { exact: true }).first().click({ timeout: 10_000 });
  } else {
    const tab = page.getByRole('tab', { name: label }).or(page.getByRole('link', { name: label }));
    await tab.first().click({ timeout: 10_000 });
  }
}

// ── Navigation helpers ────────────────────────────────────────
export async function gotoWelcome(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    try { localStorage.clear(); } catch (_) {}
    try { sessionStorage.clear(); } catch (_) {}
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

export async function signUp(
  page: Page,
  role: 'Parent' | 'Child',
  name: string,
  email: string,
  password = TEST_PASSWORD
) {
  await gotoWelcome(page);
  await clickByText(page, 'Get Started');
  await page.waitForLoadState('networkidle');

  // Click the role card
  await page.getByText(role, { exact: true }).first().click();

  await page.getByPlaceholder(/Mum or Dad|e\.g\. Alex/).fill(name);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Min 6 characters').fill(password);

  // Capture any Alert.alert() dialogs (window.alert on web) to surface errors
  let alertMsg = '';
  page.once('dialog', async dialog => {
    alertMsg = dialog.message();
    console.error(`[signUp] Alert dialog: ${alertMsg}`);
    await dialog.accept();
  });

  // Click the BUTTON — exact emoji text distinguishes it from heading "Create account 🎉"
  await page.getByText('Create Account 🚀').click({ timeout: 10_000 });

  // If an alert fired, signup failed — throw with the message
  await page.waitForTimeout(1000);
  if (alertMsg) throw new Error(`Signup failed: ${alertMsg}`);

  // Wait for navigation away from signup page
  await page.waitForURL(url => !url.pathname.includes('signup'), { timeout: SUPABASE_WAIT });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

export async function login(page: Page, email: string, password = TEST_PASSWORD) {
  await gotoWelcome(page);
  await clickByText(page, 'I already have an account');
  await page.waitForLoadState('networkidle');

  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Your password').fill(password);

  // "Sign In" button — exact match avoids "Sign in to your account" subtitle
  await page.getByText('Sign In', { exact: true }).click({ timeout: 10_000 });
  await page.waitForURL(url => !url.pathname.includes('login'), { timeout: SUPABASE_WAIT });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

export async function signOut(page: Page) {
  await clickByText(page, 'Sign out');
  await page.waitForLoadState('networkidle');
}

// ── Assertion helpers ─────────────────────────────────────────
export async function assertOnParentDashboard(page: Page) {
  await expect(
    page.getByText(/Hello,/)
      .or(page.getByText('Your Kids'))
      .or(page.getByText('Quick Actions'))
      .first()
  ).toBeVisible({ timeout: SUPABASE_WAIT });
}

export async function assertOnChildDashboard(page: Page) {
  await expect(
    page.getByText(/Hey,/)
      .or(page.getByText('Active Missions'))
      .or(page.getByText('gems available', { exact: false }))
      .first()
  ).toBeVisible({ timeout: SUPABASE_WAIT });
}

// ── Session restore (avoids login rate-limits) ───────────────
// After signUp/login, call page.context().storageState() to capture auth state.
// Then in tests, call restoreSession(page, savedState) instead of login().
export async function restoreSession(page: Page, state: any, _targetPath = '/') {
  // addInitScript runs BEFORE any page script on every navigation,
  // so Supabase reads the auth token from localStorage on first load.
  await page.addInitScript((s: any) => {
    const origins: any[] = s?.origins ?? [];
    for (const origin of origins) {
      for (const item of (origin.localStorage ?? [])) {
        try { localStorage.setItem(item.name, item.value); } catch (_) {}
      }
    }
  }, state);
  // Always navigate to '/' — Vercel reliably serves index.html there.
  // The app's auth router then redirects to the correct page.
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
}

export async function assertOnAvatarPicker(page: Page) {
  await expect(
    page.getByText(/Pick your avatar/i)
      .or(page.getByText(/Choose an emoji/i))
  ).toBeVisible({ timeout: SUPABASE_WAIT });
}

export async function assertOnJoinScreen(page: Page) {
  await expect(
    page.getByText(/Join Your Family/i)
      .or(page.getByPlaceholder('ABC123'))
      .first()
  ).toBeVisible({ timeout: SUPABASE_WAIT });
}
