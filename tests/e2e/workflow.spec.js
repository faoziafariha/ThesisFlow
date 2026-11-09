import { test, expect } from '@playwright/test';
test('student proposes, supervisor reviews, admin approves an account', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Student', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back, Amina.' })).toBeVisible();
  await page.screenshot({ path: 'docs/dashboard.png', fullPage: true });
  await page.getByRole('button', { name: 'New proposal' }).click();
  await page.getByLabel('Project title').fill('Accessible campus navigation');
  await page.getByLabel('Research area').fill('Accessibility');
  await page
    .getByLabel('Proposal abstract')
    .fill(
      'A mobile-first navigation study designed to make campus buildings more accessible for all students.',
    );
  await page.getByRole('button', { name: 'Submit proposal' }).click();
  await expect(page.getByRole('status')).toContainText('Proposal submitted');
  await page.getByRole('button', { name: /^Projects/ }).click();
  await page
    .getByRole('button')
    .filter({
      has: page.getByRole('heading', { name: 'Accessible campus navigation', exact: true }),
    })
    .click();
  await expect(page.getByRole('heading', { name: 'Research overview' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByRole('button', { name: 'Supervisor', exact: true }).click();
  await page.getByRole('button', { name: /^Projects/ }).click();
  await page
    .getByRole('button')
    .filter({
      has: page.getByRole('heading', { name: 'Accessible campus navigation', exact: true }),
    })
    .click();
  await page
    .getByLabel('Feedback', { exact: true })
    .fill('Strong proposal. Please include accessibility testing with participants.');
  await page.getByRole('button', { name: 'Send review' }).click();
  await expect(page.getByRole('status')).toContainText('Review sent');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByRole('button', { name: 'Admin', exact: true }).click();
  await page.getByRole('button', { name: 'Administration', exact: true }).click();
  await page.getByRole('button', { name: 'Approve account' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Maya Das' })).toContainText('Approved');
});
test('project filtering and mobile navigation work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Student', exact: true }).click();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: /^Projects/ }).click();
  await page.getByRole('textbox', { name: 'Search projects' }).fill('no-such-project');
  await expect(page.getByRole('heading', { name: 'No matching projects' })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    width: innerWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
});
