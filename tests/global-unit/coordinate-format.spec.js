// @ts-check
const { test, expect } = require('@playwright/test');

const url = 'http://localhost:3000/?v=-78.52435703125,37.8608744140625,-75.56244296875,39.7483255859375&l=Reference_Labels_15m,Reference_Features_15m(hidden),Coastlines_15m,VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&lg=false&s=-77.0434,38.8046&t=2023-02-15-T19%3A53%3A41Z'

test.describe.configure({ mode: 'serial' });
let page

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page.close();
});

test('Open page', async () => {
  await page.goto(url)
  await expect(page).toHaveTitle('@OFFICIAL_NAME@');
});

test('Change coordinates format from coordinate case updates global settings coordinate format', async () => {
  await page.locator('canvas').click()
  await page.locator('id=ol-coords-case').click();
  await page.getByRole('button', { name: 'Information' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();

  const dmButton = page.getByRole('button', { name: 'Set latlon-dm Format' })

  const isActive = await dmButton.getAttribute('class').then(classList => classList.includes('active'));
  await expect(isActive).toBe(true);
});

