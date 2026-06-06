import { Page, expect } from '@playwright/test';

// ── Unique test identifiers ───────────────────────────────────
export const TS = Date.now();

export function parentEmail() { return `test.parent.${TS}@kidreward-test.com`; }
export function childEmail()  { return `test.child.${TS}@kidreward-test.com`; }
export const TEST_PASSWORD = 'TestPass123!';
export const PARENT_NAME   = `TestParent${TS}`;
export const CHILD_NAME    = `TestChild${TS}`;

// ── Navigation helpers ────────────────────────────────────────
export async function gotoWelcome(page: Page) {
  // Clear storage to ensure we start unauthenticated
  await page.goto('/');
  await page.evaluate(() => {
    try { localStorage.clear(); } catch (_) {}
    try { sessionStorage.clear(); } catch (_) {}
  });
  // Reload after clearing so AuthContext re-reads (empty) storage
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Give the app a moment to process the auth state
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
  await page.getByText('Get Started').click();
  await page.getByText(role, { exact: true }).click();
  await page.getByPlaceholder(/Mum or Dad|e\.g\. Alex/).fill(name);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Min 6 characters').fill(password);
  await page.getByText('Create Account').click();
  await page.waitForLoadState('networkidle');
}

export async function login(page: Page, email: string, password = TEST_PASSWORD) {
  await gotoWelcome(page);
  await page.getByText('I already have an account').click();
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Your password').fill(password);
  await page.getByText('Sign In').click();
  await page.waitForLoadState('networkidle');
}

export async function signOut(page: Page) {
  // Sign out is in top-right corner on dashboards
  await page.getByText('Sign out').first().click();
  await page.waitForLoadState('networkidle');
}

// ── Assertion helpers ─────────────────────────────────────────
export async function assertOnParentDashboard(page: Page) {
  await expect(page.getByText('My Kids').or(page.getByText('Quick Actions'))).toBeVisible();
}

export async function assertOnChildDashboard(page: Page) {
  await expect(page.getByText('Active Missions').or(page.getByText('gems available'))).toBeVisible();
}
