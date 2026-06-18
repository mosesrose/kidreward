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
  _role: 'Parent',
  name: string,
  email: string,
  password = TEST_PASSWORD
) {
  await gotoWelcome(page);
  // Welcome screen now has separate paths: "I'm a Parent" → parent signup
  await page.getByText("I'm a Parent", { exact: false }).click();
  await page.waitForLoadState('networkidle');

  await page.getByPlaceholder('e.g. Mum or Dad').fill(name);
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
  await page.getByText('ACCESS GRANTED →').click({ timeout: 10_000 });

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

/**
 * Creates a child account via REST API (bypasses the invite-gated UI) and returns
 * a storageState with a real session — useful for tests that need a child without a
 * family (e.g., testing the join screen or session-restore).
 */
export async function signUpChildForTest(
  browser: any,
  name: string,
  email: string,
  password = TEST_PASSWORD
): Promise<any> {
  // 1. Create auth + profile via REST (no invite needed for test setup)
  const signUpResp = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const signUpData: any = await signUpResp.json();
  const childUserId = signUpData?.user?.id;
  const childJwt = signUpData?.session?.access_token ?? signUpData?.access_token;
  if (childUserId && childJwt) {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${childJwt}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ id: childUserId, name, role: 'child', avatar_emoji: '🧒' }),
    });
  }
  // 2. Log in via browser to capture real storageState
  const page = await browser.newPage();
  await login(page, email, password);
  const state = await page.context().storageState();
  await page.close();
  return state;
}

// ── Assertion helpers ─────────────────────────────────────────
export async function assertOnParentDashboard(page: Page) {
  await expect(
    page.getByText(/Welcome,/)
      .or(page.getByText('THIS WEEK'))
      .or(page.getByText('ACTION NEEDED'))
      .first()
  ).toBeVisible({ timeout: SUPABASE_WAIT });
}

export async function assertOnChildDashboard(page: Page) {
  await expect(
    page.getByText(/Hey,/)
      .or(page.getByText(/Hi /))
      .or(page.getByText('Active Quests'))
      .or(page.getByText('No quests yet'))
      .or(page.getByText('QUESTS'))
      .or(page.getByText('gems available', { exact: false }))
      .first()
  ).toBeVisible({ timeout: SUPABASE_WAIT });
}

// ── Session restore (avoids login rate-limits) ───────────────
// After signUp/login, call page.context().storageState() to capture auth state.
// Then in tests, call restoreSession(page, savedState) instead of login().
export async function restoreSession(page: Page, state: any, targetPath = '/') {
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
  // Land on '/' first so the app's auth router resolves role/session before
  // we deep-link — landing cold on a nested route can race the auth bootstrap.
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  if (targetPath !== '/') {
    await page.goto(targetPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  }
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

/** Fire React onPress for the first element whose text contains `label`. */
async function pressReact(page: any, label: string) {
  await page.evaluate((lbl: string) => {
    for (const el of Array.from(document.querySelectorAll('*'))) {
      if (!el.textContent?.includes(lbl)) continue;
      const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) continue;
      let fiber = (el as any)[fiberKey];
      while (fiber) {
        if (fiber.memoizedProps?.onPress) { fiber.memoizedProps.onPress(); return; }
        fiber = fiber.return;
      }
    }
  }, label);
}

export const SUPABASE_URL = 'https://nvrexzvpjklwfgvqcpoe.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cmV4enZwamtsd2ZndnFjcG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODE3MjgsImV4cCI6MjA5NjE1NzcyOH0.tvoIpKWFSh71jAGiIxHdagm8B2subh3e7fxbAgvw9qM';

/** Extract Supabase JWT + userId from a Playwright storageState snapshot (Node.js-side, no browser). */
function extractAuthFromState(state: any): { jwt: string; userId: string } | null {
  const origins: any[] = state?.origins ?? [];
  for (const origin of origins) {
    for (const item of (origin.localStorage ?? [])) {
      try {
        if (!item.value?.includes('access_token')) continue;
        const parsed = JSON.parse(item.value);
        const jwt = parsed?.access_token ?? parsed?.session?.access_token;
        const userId = parsed?.user?.id ?? parsed?.session?.user?.id;
        if (jwt && userId) return { jwt, userId };
      } catch {}
    }
  }
  return null;
}

/**
 * Creates a paired parent + child account for integration tests.
 * All Supabase REST API calls run from Node.js (test runner), not from inside the
 * browser page — this avoids CORS, async eval, and dual-DOM timing issues.
 */
export async function setupFamilyPair(browser: any): Promise<{
  parentState: any;
  childState: any;
  inviteCode: string;
}> {
  const ts = Date.now();

  // ── 1. Sign up parent ──────────────────────────────────────────────────────────
  const p = await browser.newPage();
  await signUp(p, 'Parent', `PairParent_${ts}`, `pair.parent.${ts}@kidreward-test.com`);
  // Wait for dashboard to fully load (confirms family row exists in DB)
  await assertOnParentDashboard(p);
  await p.waitForTimeout(1000);

  const parentState = await p.context().storageState();
  await p.close();

  // ── 2. Extract JWT + userId from storageState (Node.js) ───────────────────────
  const auth = extractAuthFromState(parentState);
  if (!auth) throw new Error('setupFamilyPair: could not extract parent JWT from storageState');

  // ── 3. Get family_id via Supabase REST API (Node.js fetch — no CORS) ──────────
  const famResp = await fetch(
    `${SUPABASE_URL}/rest/v1/families?parent_id=eq.${auth.userId}&select=id`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${auth.jwt}` } }
  );
  const families: any[] = await famResp.json();
  if (!Array.isArray(families) || families.length === 0) {
    throw new Error(`setupFamilyPair: no family found for parent ${auth.userId}. Response: ${JSON.stringify(families)}`);
  }
  const familyId = families[0].id;

  // ── 4. Create invite code via Supabase REST API (Node.js) ─────────────────────
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let inviteCode = '';
  for (let i = 0; i < 6; i++) inviteCode += chars[Math.floor(Math.random() * chars.length)];
  const childEmailForPair = `pair.child.${ts}@kidreward-test.com`;

  const invResp = await fetch(`${SUPABASE_URL}/rest/v1/invites`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${auth.jwt}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      family_id: familyId,
      code: inviteCode,
      email: childEmailForPair,
      invite_type: 'child',
      created_by: auth.userId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  if (!invResp.ok) {
    const err = await invResp.text();
    throw new Error(`setupFamilyPair: failed to create invite — ${err}`);
  }

  // ── 5. Sign up child via new invite-gated UI flow ────────────────────────────
  // Children can no longer sign up without an invite code (P0 requirement).
  // We use the invite created in step 4 to go through signup-child.tsx.
  const c = await browser.newPage();
  await gotoWelcome(c);
  await c.getByText("I'M A KID", { exact: false }).click();
  await c.waitForLoadState('networkidle');
  await c.waitForTimeout(500);

  await c.getByTestId('invite-code-input').fill(inviteCode);
  await c.getByTestId('validate-code-btn').click();
  await c.waitForLoadState('networkidle');
  await c.waitForTimeout(1000);

  // Email is pre-filled and locked from invite.email — only name and password needed
  await c.getByPlaceholder('e.g. Alex').fill(`PairChild_${ts}`);
  // Do NOT fill email — it is locked (read-only) when the invite includes an email address
  await c.getByPlaceholder('Min 6 characters').fill(TEST_PASSWORD);
  await c.getByTestId('create-child-account-btn').click();

  // Wait for redirect to child home (signup-child inserts family_member + marks invite used)
  await c.waitForURL((url: URL) => url.pathname.includes('child') || url.pathname === '/', { timeout: SUPABASE_WAIT });
  await c.waitForLoadState('networkidle');
  await c.waitForTimeout(2000);

  const childState = await c.context().storageState();
  await c.close();

  return { parentState, childState, inviteCode };
}
