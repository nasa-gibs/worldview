// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { skipTour } = require('../../test-utils/global-variables/querystrings')

let page
let selectors

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Info toolbar is visible and contains valid menu items', async () => {
  const {
    locationSearchComponent,
    locationSearchToolbarButton,
    measureBtn,
    projToolbarButton,
    shareToolbarButton,
    snapshotToolbarButton
  } = selectors
  await page.goto(skipTour)
  await expect(locationSearchComponent).toBeVisible()
  await expect(locationSearchToolbarButton).not.toBeVisible()
  await expect(measureBtn).toBeVisible()
  await expect(projToolbarButton).toBeVisible()
  await expect(shareToolbarButton).toBeVisible()
  await expect(snapshotToolbarButton).toBeVisible()
})
