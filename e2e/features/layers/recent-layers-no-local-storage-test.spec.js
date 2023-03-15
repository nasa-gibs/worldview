// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { localStorageEnabled } = require('../../test-utils/hooks/wvHooks')

let page
let selectors

const url = 'http://localhost:3000/?t=2020-07-04'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Verify that recent layers tab does not show when local storage is disabled', async () => {
  const { addLayers } = selectors
  await page.goto(url)
  const localStorage = localStorageEnabled()
  if (!localStorage) {
    await addLayers.click
    const recentTab = await page.locator('.recent-tab')
    await expect(recentTab).not.toBeVisible()
  } else {
    console.log('Local storage was enabled for this test.')
  }
})
