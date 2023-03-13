// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { switchProjections } = require('../../test-utils/hooks/wvHooks')
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

test('Data tab is available and in default state when clicked', async () => {
  const { dataDownloadTabButton } = selectors
  const queryString = 'http://localhost:3000/?l=Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m&t=2019-12-01'
  const handoffTitle = await page.locator('.smart-handoff-side-panel > h1')
  await page.goto(queryString)
  await expect(dataDownloadTabButton).toBeVisible()
  await dataDownloadTabButton.click()
  await page.waitForTimeout(5000);
  await expect(handoffTitle).toContainText('None of your current layers are available for download.')
})

test('Select "Cloud Effective Radius" layer and check that it is available for download', async () => {
  const {
    addLayers,
    allCategoryHeader,
    layersTab,
    layersModalCloseButton,
    dataDownloadTabButton,
  } = selectors
  await layersTab.click()
  await addLayers.click()
  await allCategoryHeader.click()
  await page.locator('#accordion-legacy-all-cloud-effective-radius').click()
  await page.locator('#MODIS_Aqua_Cloud_Effective_Radius-checkbox').click()
  await layersModalCloseButton.click()
  await dataDownloadTabButton.click()
  await page.locator('#C1443536017-LAADS-MODIS_Aqua_Cloud_Effective_Radius-collection-choice-label').click()
  const granuleCountHeader = await page.locator('.granule-count-header')
  const granuleCountInfo = await page.locator('.granule-count-info')
  await expect(granuleCountHeader).toContainText('Available granules for 2019 DEC 01:')
  await expect(granuleCountInfo).toBeVisible()
})