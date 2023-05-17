// @ts-check
const { test, expect } = require('@playwright/test')
const { skipTour, referenceLayersOnly } = require('../../test-utils/global-variables/querystrings')

let page

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterAll(async () => {
  await page.close()
})

test('Layer coverage is shown by default', async () => {
  await page.goto(skipTour)
  const layerCoverageAxisLine = await page.locator('.axis-matching-layer-coverage-line')
  await expect(layerCoverageAxisLine).toBeVisible()
})

test('No layer coverage is shown by default', async () => {
  await page.goto(referenceLayersOnly)
  const layerCoverageAxisLine = await page.locator('.axis-matching-layer-coverage-line')
  const layerCoverageHandle = await page.locator('#timeline-layer-coverage-panel-handle')
  await expect(layerCoverageHandle).toBeVisible()
  await expect(layerCoverageAxisLine).not.toBeVisible()
})

test('Panel opens on handle click', async () => {
  await page.goto(referenceLayersOnly)
  const layerCoverageContainer = await page.locator('.timeline-layer-coverage-container')
  const layerCoverageHandle = await page.locator('#timeline-layer-coverage-panel-handle')
  await layerCoverageHandle.click()
  await expect(layerCoverageContainer).toBeVisible()
})
