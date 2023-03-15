// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const {
  swipeAndAIsActive,
  opacityAndBIsActive,
  spyAndBIsActive
} = require('../../test-utils/global-variables/querystrings')

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

test('Swipe mode and A|B state A are active and date is correct', async () => {
  const { swipeButton, aTab } = selectors
  await page.goto(swipeAndAIsActive)
  await expect(swipeButton).not.toBeEnabled()
  await expect(aTab).toHaveClass(/active/)
  await expect(aTab).toContainText('A: 2018 AUG 17')
})

test('Opacity mode and A|B state B are active and date is correct', async () => {
  const { opacityButton, bTab } = selectors
  await page.goto(opacityAndBIsActive)
  await expect(opacityButton).not.toBeEnabled()
  await expect(bTab).toHaveClass(/active/)
  await expect(bTab).toContainText('B: 2018 AUG 16')
})

test('Spy mode is active in B state', async () => {
  const { spyButton, bTab } = selectors
  await page.goto(spyAndBIsActive)
  await expect(spyButton).not.toBeEnabled()
  await expect(bTab).toHaveClass(/active/)
  await expect(bTab).toContainText('B: 2018 AUG 16')
})

test('A|B loaded with only one layer in A section -- Corrected Reflectance (True Color)', async () => {
  await page.goto(swipeAndAIsActive)
  const overlayLayer = page.locator('.ab-tabs-case .tab-pane.active ul#overlays .item')
  const correctedReflectance = page.locator('#active-MODIS_Terra_CorrectedReflectance_TrueColor')
  await expect(overlayLayer).not.toBeVisible()
  await expect(correctedReflectance).toBeVisible()
})

test('Click B tab to ensure that loaded layers are correct', async () => {
  const { bTab } = selectors
  const aquaLayer = page.locator('#activeB-MODIS_Aqua_CorrectedReflectance_TrueColor.layer-hidden')
  const snppLayer = page.locator('#activeB-VIIRS_SNPP_CorrectedReflectance_TrueColor.layer-hidden')
  const refLabels = page.locator('#activeB-Reference_Labels_15m.layer-hidden')
  const refFeatures = page.locator('#activeB-Reference_Features_15m.layer-hidden')
  const coastlines = page.locator('#activeB-Coastlines_15m.layer-visible')
  const terraLayer = page.locator('#activeB-MODIS_Terra_CorrectedReflectance_TrueColor.layer-visible')
  await bTab.click()
  await expect(aquaLayer).toBeVisible()
  await expect(snppLayer).toBeVisible()
  await expect(refLabels).toBeVisible()
  await expect(refFeatures).toBeVisible()
  await expect(coastlines).toBeVisible()
  await expect(terraLayer).toBeVisible()
})
