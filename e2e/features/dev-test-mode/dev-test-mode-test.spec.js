// @ts-check
const { test, expect } = require('@playwright/test')
const { skipTour } = require('../../test-utils/global-variables/querystrings')

let page

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterAll(async () => {
  await page.close()
})

test('Ensure that dev test mode is not on', async () => {
  await page.goto(skipTour)
  const devBlock = page.locator('#dev-block')
  await expect(devBlock).not.toBeVisible()
})
