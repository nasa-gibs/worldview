// @ts-check
const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
  await page.goto('localhost:3000');

  await expect(page).toHaveTitle('@OFFICIAL_NAME@');
});