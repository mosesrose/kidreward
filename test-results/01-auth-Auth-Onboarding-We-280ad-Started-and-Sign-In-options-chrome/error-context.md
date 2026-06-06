# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-auth.spec.ts >> Auth & Onboarding >> Welcome screen shows both Get Started and Sign In options
- Location: tests\e2e\01-auth.spec.ts:62:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [ref=e12]:
  - generic [ref=e13]: ⭐
  - generic [ref=e14]: 💎
  - generic [ref=e15]: 🌟
  - generic [ref=e16]:
    - generic [ref=e17]: 🏆
    - generic [ref=e18]: KidReward
    - generic [ref=e19]: Turn good habits into amazing rewards! 💎
  - generic [ref=e20]:
    - generic [ref=e21]:
      - generic [ref=e22]: 📋
      - generic [ref=e23]: Complete challenges set by your parents
    - generic [ref=e24]:
      - generic [ref=e25]: 💎
      - generic [ref=e26]: Earn Gems for every task you finish
    - generic [ref=e27]:
      - generic [ref=e28]: 🎁
      - generic [ref=e29]: Redeem Gems for gifts, money & more
  - generic [ref=e30]:
    - generic [ref=e33] [cursor=pointer]: Get Started ✨
    - generic [ref=e35] [cursor=pointer]: I already have an account
```

# Test source

```ts
  1  | /**
  2  |  * US-001  Sign up as a parent and have a family auto-created
  3  |  * US-002  Sign up as a child and pick an emoji avatar
  4  |  * US-003  Log in and be redirected to the correct dashboard
  5  |  */
  6  | import { test, expect } from '@playwright/test';
  7  | import {
  8  |   parentEmail, childEmail, TEST_PASSWORD, PARENT_NAME, CHILD_NAME,
  9  |   gotoWelcome, signUp, login, signOut,
  10 |   assertOnParentDashboard, assertOnChildDashboard,
  11 | } from './helpers';
  12 | 
  13 | test.describe('Auth & Onboarding', () => {
  14 | 
  15 |   test('US-001 | Parent can sign up and reach dashboard', async ({ page }) => {
  16 |     await signUp(page, 'Parent', PARENT_NAME, parentEmail());
  17 | 
  18 |     // Should be on parent dashboard — family was auto-created
  19 |     await assertOnParentDashboard(page);
  20 |     // Name should appear in greeting
  21 |     await expect(page.getByText(PARENT_NAME, { exact: false })).toBeVisible();
  22 |   });
  23 | 
  24 |   test('US-002 | Child can sign up and pick an emoji avatar', async ({ page }) => {
  25 |     await signUp(page, 'Child', CHILD_NAME, childEmail());
  26 | 
  27 |     // After child signup → avatar picker screen
  28 |     // 12 emoji options should be visible
  29 |     const emojis = page.locator('text=🧒').or(page.locator('text=👦')).or(page.locator('text=👧'));
  30 |     await expect(emojis.first()).toBeVisible();
  31 | 
  32 |     // Pick an avatar and proceed
  33 |     await page.locator('text=🦊').click();
  34 |     await page.getByText("Let's go!").click();
  35 |     await page.waitForLoadState('networkidle');
  36 | 
  37 |     // Should land on join screen (no family yet)
  38 |     await expect(page.getByText('Join Your Family').or(page.getByText('invite code'))).toBeVisible();
  39 |   });
  40 | 
  41 |   test('US-003 | Parent login redirects to parent dashboard', async ({ page }) => {
  42 |     // Sign up first to have an account
  43 |     await signUp(page, 'Parent', `LoginTest${Date.now()}`, `login.parent.${Date.now()}@kidreward-test.com`);
  44 |     await signOut(page);
  45 | 
  46 |     // Now log in
  47 |     await login(page, parentEmail());
  48 |     await assertOnParentDashboard(page);
  49 |   });
  50 | 
  51 |   test('US-003 | Child login redirects to child dashboard or join screen', async ({ page }) => {
  52 |     await signUp(page, 'Child', `LoginChild${Date.now()}`, `login.child.${Date.now()}@kidreward-test.com`);
  53 |     await signOut(page);
  54 | 
  55 |     await login(page, childEmail());
  56 |     // Either on join screen (no family) or child dashboard
  57 |     const onJoin = await page.getByText('Join Your Family').isVisible().catch(() => false);
  58 |     const onDash = await page.getByText('Active Missions').isVisible().catch(() => false);
  59 |     expect(onJoin || onDash).toBeTruthy();
  60 |   });
  61 | 
  62 |   test('Welcome screen shows both Get Started and Sign In options', async ({ page }) => {
  63 |     await gotoWelcome(page);
  64 |     await page.getByText('Sign out').click().catch(() => {}); // sign out if logged in
> 65 |     await page.goto('/');
     |                ^ Error: page.goto: Target page, context or browser has been closed
  66 |     await page.waitForLoadState('networkidle');
  67 | 
  68 |     // If on welcome screen
  69 |     const welcomeVisible = await page.getByText('Get Started').isVisible().catch(() => false);
  70 |     if (welcomeVisible) {
  71 |       await expect(page.getByText('Get Started')).toBeVisible();
  72 |       await expect(page.getByText('I already have an account')).toBeVisible();
  73 |     }
  74 |     // Already logged in — just pass
  75 |   });
  76 | 
  77 | });
  78 | 
```