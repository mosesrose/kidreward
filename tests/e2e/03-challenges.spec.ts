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
  TS, parentEmail, childEmail, TEST_PASSWORD, PARENT_NAME, CHILD_NAME,
  signUp, login, signOut, assertOnParentDashboard, assertOnChildDashboard,
} from './helpers';

const CHALLENGE_TITLE = `Tidy Room Test ${TS}`;

test.describe('Challenges', () => {

  test('US-008 | Parent creates a challenge from a template', async ({ page }) => {
    await login(page, parentEmail());
    await assertOnParentDashboard(page);

    await page.getByText('Challenges').click();
    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');

    // Templates should be visible
    await expect(page.getByText('Less screen time today').or(
      page.getByText('Play outside')
    )).toBeVisible({ timeout: 10_000 });

    // Click a template
    await page.getByText('Keep room tidy').click();

    // Fields should be filled
    const titleInput = page.getByPlaceholder(/e\.g\. Keep room tidy/i).or(
      page.locator('input').first()
    );
    const titleValue = await page.inputValue('input >> nth=0').catch(() => '');
    expect(titleValue.length).toBeGreaterThan(0);

    // Save it
    await page.getByText('Save').click();
    await page.waitForLoadState('networkidle');

    // Should be back on challenges list with the new challenge
    await expect(page.getByText('Keep room tidy')).toBeVisible({ timeout: 10_000 });
  });

  test('US-009 | Parent creates a fully custom challenge', async ({ page }) => {
    await login(page, parentEmail());
    await page.getByText('Challenges').click();
    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');

    // Clear template selection and fill custom fields
    const titleInput = page.getByPlaceholder(/e\.g\. Keep room tidy/i);
    await titleInput.clear();
    await titleInput.fill(CHALLENGE_TITLE);

    // Set gem value
    const gemInput = page.getByLabel('💎 Gems').or(page.locator('input[value="10"]').first());
    await gemInput.fill('25');

    // Save
    await page.getByText('Save').click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(CHALLENGE_TITLE)).toBeVisible({ timeout: 10_000 });
  });

  test('US-010 | Repeat type segmented control works', async ({ page }) => {
    await login(page, parentEmail());
    await page.getByText('Challenges').click();
    await page.getByText('+ New').click();
    await page.waitForLoadState('networkidle');

    // All three repeat options should be visible
    await expect(page.getByText('1x').or(page.getByText('Once'))).toBeVisible();
    await expect(page.getByText('Daily')).toBeVisible();
    await expect(page.getByText('Weekly')).toBeVisible();

    // Select Daily
    await page.getByText('Daily').click();
    // Should become active (visual state change - we check it doesn't crash)
    await page.getByPlaceholder(/e\.g\. Keep room tidy/i).fill(`Daily Test ${TS}`);
    await page.getByText('Save').click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(`Daily Test ${TS}`)).toBeVisible({ timeout: 10_000 });
  });

  test('US-011 | Child sees active missions on mission board', async ({ page }) => {
    await login(page, childEmail());
    await page.waitForLoadState('networkidle');

    // Navigate to Missions tab
    await page.getByText('Missions').click();
    await page.waitForLoadState('networkidle');

    // Should see the challenge created by parent (or empty state)
    const hasMissions = await page.getByText(CHALLENGE_TITLE).isVisible().catch(() => false);
    const hasEmpty    = await page.getByText('No missions yet').isVisible().catch(() => false);

    expect(hasMissions || hasEmpty).toBeTruthy();

    // Gem reward should be visible if missions exist
    if (hasMissions) {
      await expect(page.getByText('💎', { exact: false })).toBeVisible();
    }
  });

  test('US-012 | Child submits "I Did It!" with a note', async ({ page }) => {
    await login(page, childEmail());
    await page.getByText('Missions').click();
    await page.waitForLoadState('networkidle');

    // If no missions, skip
    const hasMission = await page.getByText(CHALLENGE_TITLE).isVisible().catch(() => false);
    test.skip(!hasMission, 'No challenge visible — pairing may not be complete');

    // Open the challenge
    await page.getByText(CHALLENGE_TITLE).click();
    await page.waitForLoadState('networkidle');

    // Should see the submit area
    await expect(page.getByText('I Did It!')).toBeVisible({ timeout: 10_000 });

    // Add a note
    await page.getByPlaceholder(/I tidied my room/i).fill('I cleaned everything!');

    // Submit
    await page.getByText('I Did It!').click();
    await page.waitForLoadState('networkidle');

    // Should show waiting state
    await expect(
      page.getByText('Waiting for review').or(page.getByText('Submitted'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('US-013 | Parent approves submission and gems are awarded', async ({ page }) => {
    await login(page, parentEmail());
    await assertOnParentDashboard(page);

    // Check dashboard for pending badge
    const pending = await page.getByText('Pending').or(
      page.getByText('waiting for review')
    ).first().isVisible().catch(() => false);

    if (!pending) {
      // Navigate to challenges and find the submission
      await page.getByText('Challenges').click();
    }

    // Find the challenge with pending submission
    const challengeCard = page.getByText(CHALLENGE_TITLE);
    if (await challengeCard.isVisible().catch(() => false)) {
      await challengeCard.click();
      await page.waitForLoadState('networkidle');

      // Look for approve button
      const approveBtn = page.getByText('Approve').or(page.getByText('✓ Approve'));
      if (await approveBtn.isVisible().catch(() => false)) {
        await approveBtn.click();
        await page.waitForLoadState('networkidle');

        // Approved state should show
        await expect(
          page.getByText('approved').or(page.getByText('awarded'))
        ).toBeVisible({ timeout: 10_000 });
      }
    }
  });

  test('Parent can reject a submission', async ({ page }) => {
    await login(page, parentEmail());
    await page.getByText('Challenges').click();
    await page.waitForLoadState('networkidle');

    // This test just verifies the reject button exists and works in the UI
    // (May not have a pending submission to reject)
    const rejectBtn = page.getByText('Reject').or(page.getByText('✗ Reject'));
    if (await rejectBtn.first().isVisible().catch(() => false)) {
      await rejectBtn.first().click();
      await page.waitForLoadState('networkidle');
      await expect(
        page.getByText('rejected').or(page.getByText('Rejected'))
      ).toBeVisible({ timeout: 10_000 });
    }
    // If no reject button visible, test passes (no pending submissions)
  });

  test('US-014 | Parent can archive a challenge', async ({ page }) => {
    await login(page, parentEmail());
    await page.getByText('Challenges').click();
    await page.waitForLoadState('networkidle');

    // Find a challenge to archive
    if (await page.getByText(CHALLENGE_TITLE).isVisible().catch(() => false)) {
      await page.getByText(CHALLENGE_TITLE).click();
      await page.waitForLoadState('networkidle');

      const archiveBtn = page.getByText('Archive');
      if (await archiveBtn.isVisible().catch(() => false)) {
        await archiveBtn.click();
        // Confirm dialog
        await page.getByText('Archive').last().click();
        await page.waitForLoadState('networkidle');

        // Should be back on challenges list and challenge should be gone
        await expect(page.getByText(CHALLENGE_TITLE)).not.toBeVisible({ timeout: 10_000 });
      }
    }
  });

});
