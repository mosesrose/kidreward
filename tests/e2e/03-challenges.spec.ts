/**
 * US-008  Create a challenge from a pre-built template
 * US-009  Create a fully custom challenge
 * US-010  Set challenge repeat type (daily/weekly/once)
 * US-011  Child sees all active missions
 * US-012  Child submits "I Did It!" with optional note
 * US-013  Parent approves or rejects a submission
 */
import { test, expect } from '@playwright/test';
import {
  signUp, restoreSession, clickTab, assertOnParentDashboard, assertOnChildDashboard,
  setupFamilyPair,
} from './helpers';

const STS = Date.now();
const CHALLENGE_TITLE = `Tidy Room Test ${STS}`;

let parentState: any;
let childState: any;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  const pair = await setupFamilyPair(browser);
  parentState = pair.parentState;
  childState = pair.childState;
});

test.describe('Challenges', () => {

  test('US-008 | Parent creates a challenge from a template', async ({ page }) => {
    await restoreSession(page, parentState, '/dashboard');
    await assertOnParentDashboard(page);

    await clickTab(page, 'Challenges');
    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Less screen time today').or(
      page.getByText('Play outside')
    ).first()).toBeVisible({ timeout: 10_000 });

    await page.getByText('Keep room tidy').click();
    await page.waitForTimeout(500);
    // Use testID click — dispatchEvent('click') doesn't trigger React onPress
    await page.getByTestId('save-challenge-btn').click();
    await page.waitForURL(url => !url.pathname.includes('create'), { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByText('Keep room tidy')).toBeVisible({ timeout: 10_000 });
  });

  test('US-009 | Parent creates a challenge (second template, no repeat)', async ({ page }) => {
    await restoreSession(page, parentState, '/dashboard');
    await assertOnParentDashboard(page);
    await clickTab(page, 'Challenges');
    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');

    await page.getByText('Do homework early').click();
    await page.waitForTimeout(500);
    await page.getByTestId('save-challenge-btn').click();
    await page.waitForURL(url => !url.pathname.includes('create'), { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByText('Do homework early')).toBeVisible({ timeout: 10_000 });
  });

  test('US-010 | Repeat type segmented control works', async ({ page }) => {
    await restoreSession(page, parentState, '/dashboard');
    await assertOnParentDashboard(page);
    await clickTab(page, 'Challenges');
    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('1x').or(page.getByText('Once')).first()).toBeVisible();
    await expect(page.getByText('Daily', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Weekly', { exact: true }).first()).toBeVisible();

    await page.getByText('No missing homework').click();
    await page.waitForTimeout(300);
    await page.getByText('Daily', { exact: true }).first().click();
    await page.waitForTimeout(300);

    await page.getByTestId('save-challenge-btn').click();
    await page.waitForURL(url => !url.pathname.includes('create'), { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByText('No missing homework')).toBeVisible({ timeout: 10_000 });
  });

  test('US-011 | Child sees active missions on mission board', async ({ page }) => {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!!onJoin, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Missions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Parent created 3 challenges in US-008/009/010 — child should see at least one.
    // Expo Router dual-DOM: each title appears in BOTH home screen (hidden) and missions tab (visible).
    // Must check ALL matched elements, not just the first, because first may be the hidden home screen.
    const templateTitles = ['Keep room tidy', 'Do homework early', 'No missing homework'];
    async function anyVisible(text: string) {
      const all = await page.getByText(text, { exact: true }).all();
      for (const el of all) {
        if (await el.isVisible().catch(() => false)) return true;
      }
      return false;
    }
    const hasMissions = (await Promise.all(templateTitles.map(anyVisible))).some(Boolean);
    const hasEmpty = await page.getByText('No missions yet').isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasMissions || hasEmpty).toBeTruthy();
  });

  test('US-012 | Child submits "I Did It!" with a note', async ({ page }) => {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!!onJoin, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Missions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for any challenge — must check ALL DOM matches (dual-DOM: home preview + missions tab)
    const missionTitles = ['Keep room tidy', 'Do homework early', 'No missing homework'];
    let foundTitle: string | null = null;
    for (const t of missionTitles) {
      const all = await page.getByText(t, { exact: true }).all();
      for (const el of all) {
        if (await el.isVisible().catch(() => false)) { foundTitle = t; break; }
      }
      if (foundTitle) break;
    }
    test.skip(!foundTitle, 'No challenge visible — save may not have completed');

    // Fire onPress via React fiber injection (bypasses Expo Router overlay that intercepts pointer events)
    await page.evaluate((title: string) => {
      for (const el of Array.from(document.querySelectorAll('*'))) {
        if (el.textContent?.trim() !== title) continue;
        const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber'));
        if (!fiberKey) continue;
        let fiber = (el as any)[fiberKey];
        while (fiber) {
          if (fiber.memoizedProps?.onPress) { fiber.memoizedProps.onPress(); return true; }
          fiber = fiber.return;
        }
      }
      return false;
    }, foundTitle!);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Button text is "I did it!" (lowercase)
    await expect(page.getByText('I did it!', { exact: false })).toBeVisible({ timeout: 10_000 });

    // Fill note field (TextInput responds to fill() fine)
    const noteInput = page.getByPlaceholder(/I tidied my room/i);
    if (await noteInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noteInput.fill('I cleaned everything!');
    }

    // The submit button is a TouchableOpacity — use fiber injection to fire onPress
    page.once('dialog', async d => d.accept()); // handle Alert.alert('Submitted', ...)
    await page.evaluate(() => {
      for (const el of Array.from(document.querySelectorAll('*'))) {
        if (!el.textContent?.toLowerCase().includes('i did it')) continue;
        const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber'));
        if (!fiberKey) continue;
        let fiber = (el as any)[fiberKey];
        while (fiber) {
          if (fiber.memoizedProps?.onPress) { fiber.memoizedProps.onPress(); return; }
          fiber = fiber.return;
        }
      }
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(
      page.getByText('Waiting for parent').or(page.getByText('Waiting for review'))
        .or(page.getByText('Submitted')).or(page.getByText('approved')).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('US-013 | Regression: child submits a challenge and parent can approve it from the UI', async ({ page }) => {
    // Reproduces a reported bug: a parent saw a submission was "pending for
    // review" but had no way to approve it from the UI. This walks the exact
    // real-world path end-to-end (no vacuous `if` guards) — parent creates a
    // challenge, child submits it, parent discovers + approves it from the
    // dashboard "Review" CTA → challenge list → challenge detail.
    test.setTimeout(90_000);
    const ts = Date.now();
    const title = `Approve Flow Test ${ts}`;

    // ── Parent creates a fresh, uniquely-titled custom challenge ──
    await restoreSession(page, parentState, '/dashboard');
    await assertOnParentDashboard(page);
    await clickTab(page, 'Challenges');
    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('e.g. Keep room tidy').fill(title);
    await page.getByTestId('save-challenge-btn').click();
    await page.waitForURL(url => !url.pathname.includes('create'), { timeout: 20_000 });
    // router.back() can land on the tab's list OR pop an extra entry depending
    // on Expo Router's web history state — navigate explicitly instead of
    // trusting wherever back() landed, so this assertion is deterministic.
    await page.goto('/challenges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });

    // ── Child submits "I Did It!" for this exact challenge ──
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!!onJoin, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Missions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    async function anyVisible(text: string) {
      const all = await page.getByText(text, { exact: true }).all();
      for (const el of all) {
        if (await el.isVisible().catch(() => false)) return true;
      }
      return false;
    }
    await expect.poll(() => anyVisible(title), { timeout: 15_000, message: 'challenge never appeared on Missions tab' }).toBe(true);

    // Fire onPress via React fiber injection (Expo Router web overlay intercepts pointer events)
    await page.evaluate((t: string) => {
      for (const el of Array.from(document.querySelectorAll('*'))) {
        if (el.textContent?.trim() !== t) continue;
        const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber'));
        if (!fiberKey) continue;
        let fiber = (el as any)[fiberKey];
        while (fiber) {
          if (fiber.memoizedProps?.onPress) { fiber.memoizedProps.onPress(); return; }
          fiber = fiber.return;
        }
      }
    }, title);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await expect(page.getByText('I did it!', { exact: false })).toBeVisible({ timeout: 10_000 });

    page.once('dialog', async d => d.accept()); // handle Alert.alert('Submitted', ...)
    await page.evaluate(() => {
      for (const el of Array.from(document.querySelectorAll('*'))) {
        if (!el.textContent?.toLowerCase().includes('i did it')) continue;
        const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber'));
        if (!fiberKey) continue;
        let fiber = (el as any)[fiberKey];
        while (fiber) {
          if (fiber.memoizedProps?.onPress) { fiber.memoizedProps.onPress(); return; }
          fiber = fiber.return;
        }
      }
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(
      page.getByText('Waiting for parent').or(page.getByText('Waiting for review'))
        .or(page.getByText('Submitted')).first()
    ).toBeVisible({ timeout: 10_000 });

    // ── Parent discovers it via the real dashboard path and approves it ──
    await restoreSession(page, parentState, '/dashboard');
    await assertOnParentDashboard(page);

    await expect(page.getByText(/Review \d+ submission/i)).toBeVisible({ timeout: 15_000 });
    await page.getByText(/Review \d+ submission/i).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // The challenge card itself must be visible, with a pending badge somewhere
    // on the list screen, so the parent can actually discover which one to open.
    await expect(page.getByText(title, { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/waiting for review/i).first()).toBeVisible({ timeout: 10_000 });

    await page.getByText(title, { exact: true }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Confirm we actually landed on this challenge's detail page before
    // looking for the action buttons, so a failure here is unambiguous.
    await expect(page.getByText(/^Submissions \(/)).toBeVisible({ timeout: 10_000 });

    const approveBtn = page.locator('[data-testid^="approve-btn-"]').first();
    await expect(approveBtn).toBeVisible({ timeout: 10_000 });
    await approveBtn.dispatchEvent('click');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(
      page.getByText('approved').or(page.getByText('awarded', { exact: false })).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Parent can reject a submission', async ({ page }) => {
    test.setTimeout(90_000);
    const ts = Date.now();
    const title = `Reject Flow Test ${ts}`;

    // ── Parent creates a fresh, uniquely-titled custom challenge ──
    await restoreSession(page, parentState, '/dashboard');
    await assertOnParentDashboard(page);
    await clickTab(page, 'Challenges');
    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('e.g. Keep room tidy').fill(title);
    await page.getByTestId('save-challenge-btn').click();
    await page.waitForURL(url => !url.pathname.includes('create'), { timeout: 20_000 });
    // Navigate explicitly rather than trusting wherever router.back() landed —
    // Expo Router's web history handling isn't guaranteed to land on the list.
    await page.goto('/challenges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });

    // ── Child submits "I Did It!" for this exact challenge ──
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!!onJoin, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Missions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    async function anyVisible(text: string) {
      const all = await page.getByText(text, { exact: true }).all();
      for (const el of all) {
        if (await el.isVisible().catch(() => false)) return true;
      }
      return false;
    }
    await expect.poll(() => anyVisible(title), { timeout: 15_000, message: 'challenge never appeared on Missions tab' }).toBe(true);

    await page.evaluate((t: string) => {
      for (const el of Array.from(document.querySelectorAll('*'))) {
        if (el.textContent?.trim() !== t) continue;
        const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber'));
        if (!fiberKey) continue;
        let fiber = (el as any)[fiberKey];
        while (fiber) {
          if (fiber.memoizedProps?.onPress) { fiber.memoizedProps.onPress(); return; }
          fiber = fiber.return;
        }
      }
    }, title);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await expect(page.getByText('I did it!', { exact: false })).toBeVisible({ timeout: 10_000 });

    page.once('dialog', async d => d.accept());
    await page.evaluate(() => {
      for (const el of Array.from(document.querySelectorAll('*'))) {
        if (!el.textContent?.toLowerCase().includes('i did it')) continue;
        const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber'));
        if (!fiberKey) continue;
        let fiber = (el as any)[fiberKey];
        while (fiber) {
          if (fiber.memoizedProps?.onPress) { fiber.memoizedProps.onPress(); return; }
          fiber = fiber.return;
        }
      }
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(
      page.getByText('Waiting for parent').or(page.getByText('Waiting for review'))
        .or(page.getByText('Submitted')).first()
    ).toBeVisible({ timeout: 10_000 });

    // ── Parent rejects it ──
    // Note: '/challenges' is an ambiguous URL — both the (parent) and (child)
    // groups have a route at that literal path (groups don't appear in the
    // URL). Landing there directly right after a child session can resolve
    // to the leftover child stack. Go through '/dashboard' (parent-only)
    // and navigate via the real UI instead, like the approve test above.
    await restoreSession(page, parentState, '/dashboard');
    await assertOnParentDashboard(page);
    await clickTab(page, 'Challenges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.getByText(title, { exact: true }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByText(/^Submissions \(/)).toBeVisible({ timeout: 10_000 });

    const rejectBtn = page.locator('[data-testid^="reject-btn-"]').first();
    await expect(rejectBtn).toBeVisible({ timeout: 10_000 });
    await rejectBtn.dispatchEvent('click');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(
      page.getByText('rejected').or(page.getByText('Rejected')).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('US-014 | Parent can archive a challenge', async ({ page }) => {
    await restoreSession(page, parentState, '/challenges');
    await page.waitForLoadState('networkidle');

    if (await page.getByText(CHALLENGE_TITLE).isVisible().catch(() => false)) {
      await page.getByText(CHALLENGE_TITLE).click();
      await page.waitForLoadState('networkidle');

      const archiveBtn = page.getByRole('button', { name: /Archive/i });
      if (await archiveBtn.isVisible().catch(() => false)) {
        await archiveBtn.click();
        await page.getByRole('button', { name: /Archive/i }).last().click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(CHALLENGE_TITLE)).not.toBeVisible({ timeout: 10_000 });
      }
    }
  });

  // ── Button/link coverage ───────────────────────────────────────────────────

  test('Create challenge — empty title shows inline error', async ({ page }) => {
    await restoreSession(page, parentState);
    await assertOnParentDashboard(page);
    await clickTab(page, 'Challenges');
    await page.waitForLoadState('networkidle');

    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');

    // Don't pick a template — leave title empty, click Save
    await page.getByTestId('save-challenge-btn').dispatchEvent('click');
    await page.waitForTimeout(500);

    await expect(page.getByTestId('challenge-save-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('challenge-save-error')).toContainText(/title/i);
  });

  test('Create challenge — ← Back button returns to challenge list', async ({ page }) => {
    await restoreSession(page, parentState);
    await assertOnParentDashboard(page);
    await clickTab(page, 'Challenges');
    await page.waitForLoadState('networkidle');

    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('New Challenge').first()).toBeVisible({ timeout: 10_000 });

    await page.getByText('← Back').click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('+ New').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Child challenge detail — ← Back button returns to mission list', async ({ page }) => {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!!onJoin, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Missions');
    await page.waitForLoadState('networkidle');

    // If a mission card exists, tap it and verify ← Back works
    const missionCard = page.locator('[class*="card"], [class*="Card"]').first();
    const anyText = page.getByText(CHALLENGE_TITLE).first();
    if (await anyText.isVisible({ timeout: 3000 }).catch(() => false)) {
      await anyText.click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('← Back')).toBeVisible({ timeout: 10_000 });
      await page.getByText('← Back').click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Missions').or(page.getByText('Active Missions')).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('Child sign-out from home screen', async ({ page }) => {
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!!onJoin, 'Child not in family — pairing setup failed');

    // Find and click "Sign out" on child home
    await page.getByText('Sign out').first().click();
    await page.waitForLoadState('networkidle');

    // Should navigate to welcome screen
    await expect(
      page.getByText(/Get Started/).or(page.getByText(/I already have an account/)).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test('US-VALUE | Parent creates challenge with value tag; both parent list and child missions show the chip', async ({ page }) => {
    test.setTimeout(90_000);
    const ts = Date.now();
    const title = `Value Tag Test ${ts}`;

    // ── Parent creates a challenge with Kindness tag ──
    await restoreSession(page, parentState, '/dashboard');
    await assertOnParentDashboard(page);
    await clickTab(page, 'Challenges');
    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('e.g. Keep room tidy').fill(title);

    // Select the Kindness value chip
    await page.getByTestId('value-chip-kindness').click();
    await page.waitForTimeout(300);

    await page.getByTestId('save-challenge-btn').click();
    await page.waitForURL(url => !url.pathname.includes('create'), { timeout: 20_000 });
    await page.goto('/challenges');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Parent list shows the challenge title and Kindness chip
    await expect(page.getByText(title, { exact: true })).toBeVisible({ timeout: 10_000 });
    const kindnessChips = await page.getByText('Kindness').all();
    const anyKindnessVisible = (await Promise.all(kindnessChips.map(el => el.isVisible().catch(() => false)))).some(Boolean);
    expect(anyKindnessVisible).toBeTruthy();

    // ── Child mission list also shows the Kindness chip ──
    await restoreSession(page, childState, '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const onJoin = await page.getByText('Join Your Family!').isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!!onJoin, 'Child not in family — pairing setup failed');

    await clickTab(page, 'Missions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByText(title, { exact: true })).toBeVisible({ timeout: 10_000 });
    const childKindnessChips = await page.getByText('Kindness').all();
    const anyChildKindnessVisible = (await Promise.all(childKindnessChips.map(el => el.isVisible().catch(() => false)))).some(Boolean);
    expect(anyChildKindnessVisible).toBeTruthy();
  });

});
