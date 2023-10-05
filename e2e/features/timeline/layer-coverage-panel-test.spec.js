// @ts-check
const { test, expect } = require('@playwright/test')
const { skipTour, referenceLayersOnly } = require('../../test-utils/global-variables/querystrings')
const createSelectors = require('../../test-utils/global-variables/selectors')

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

test('Layer coverage is shown by default', async () => {
  const { modalCloseButton } = selectors
  await page.goto(skipTour)
  await modalCloseButton.click()
  const layerCoverageAxisLine = await page.locator('.axis-matching-layer-coverage-line')
  await expect(layerCoverageAxisLine).toBeVisible()
})

test('No layer coverage is shown by default', async () => {
  const { modalCloseButton } = selectors
  await page.goto(referenceLayersOnly)
  await modalCloseButton.click()
  const layerCoverageAxisLine = await page.locator('.axis-matching-layer-coverage-line')
  const layerCoverageHandle = await page.locator('#timeline-layer-coverage-panel-handle')
  await expect(layerCoverageHandle).toBeVisible()
  await expect(layerCoverageAxisLine).not.toBeVisible()
})

test('Panel opens on handle click', async () => {
  const { modalCloseButton } = selectors
  await page.goto(referenceLayersOnly)
  await modalCloseButton.click()
  const layerCoverageContainer = await page.locator('.timeline-layer-coverage-container')
  const layerCoverageHandle = await page.locator('#timeline-layer-coverage-panel-handle')
  await layerCoverageHandle.click()
  await expect(layerCoverageContainer).toBeVisible()
})
