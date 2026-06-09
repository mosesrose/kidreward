/**
 * US-001  Sign up as a parent and have a family auto-created
 * US-002  Sign up as a child and pick an emoji avatar
 * US-003  Log in and be redirected to the correct dashboard
 */
import { test, expect } from '@playwright/test';
import {
  parentEmail, childEmail, TEST_PASSWORD, PARENT_NAME, CHILD_NAME,
  gotoWelcome, signUp, login, signOut, clickByText,
  assertOnParentDashboard, assertOnChildDashboard, assertOnAvatarPicker, assertOnJoinScreen,
  SUPABASE_WAIT,
} from './helpers';

test.describe('Auth & Onboarding', () => {

  test('US-001 | Parent can sign up and reach dashboard', async ({ page }) => {
    await signUp(page, 'Parent', PARENT_NAME, parentEmail());
    await assertOnParentDashboard(page);
  });

  test('US-002 | Child can sign up and lands on join screen', async ({ page }) => {
    await signUp(page, 'Child', CHILD_NAME, childEmail());
    // After child signup (no family yet) → join family screen
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

});
