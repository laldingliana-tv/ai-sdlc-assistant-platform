import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AI SDLC Assistant/);
});

test('navigates to tasks page', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Tasks');
  await expect(page).toHaveURL('/tasks');
  await expect(page.locator('h1')).toContainText('Tasks');
});

test('navigates to new task page', async ({ page }) => {
  await page.goto('/tasks');
  await page.click('text=New Task');
  await expect(page).toHaveURL('/tasks/new');
  await expect(page.locator('h1')).toContainText('Create Task');
});
