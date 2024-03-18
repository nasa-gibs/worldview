// @ts-check
/* These tests take a screenshots & compare the image output to an existing reference image in the /classification-test.spec.js-snapshots directory. There are reference images for various platforms.
toHaveScreenshot() will create a reference image if it doesn't already exist. So, if you need to
generate any new reference images simply delete the old ones & run this test again on both windows &
Mac to generate the required reference images for all platforms.
*/

const { test, expect } = require('@playwright/test')
let page

const floodOnlyGrayUrl = 'http://localhost:3000/?v=-141,-32,21,66&df=true&l=MODIS_Combined_Flood_2-Day(disabled=3-0)&lg=true&t=2023-12-07-T18%3A49%3A23Z'
const floodGrayAndBlueUrl = 'http://localhost:3000/?v=-139,-44,23,54&df=true&l=MODIS_Combined_Flood_2-Day(disabled=3-1)&lg=true&t=2023-12-07-T18%3A49%3A23Z'
const floodAllColorsUrl = 'http://localhost:3000/?v=40,22,53,33&df=true&l=MODIS_Combined_Flood_2-Day&lg=true&t=2023-01-07-T18%3A49%3A23Z'

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterEach(async () => {
  await page.close()
})

test('Flood 2 Day only Gray', async () => {
  await page.goto(floodOnlyGrayUrl)
  await page.waitForLoadState('load')
  await page.waitForTimeout(5000)

  await expect(page).toHaveScreenshot('only-gray.png', {
    fullPage: true,
    threshold: 0.2
  })
})

test('Flood 2 Day Gray & Blue', async () => {
  await page.goto(floodGrayAndBlueUrl)
  await page.waitForLoadState('load')
  await page.waitForTimeout(5000)

  await expect(page).toHaveScreenshot('gray-and-blue.png', {
    fullPage: true,
    threshold: 0.2
  })
})

test('Flood 2 Day All Colors', async () => {
  await page.goto(floodAllColorsUrl)
  await page.waitForLoadState('load')
  await page.waitForTimeout(5000)

  await expect(page).toHaveScreenshot('all-colors.png', {
    fullPage: true,
    threshold: 0.2
  })
})
