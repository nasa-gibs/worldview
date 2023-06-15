// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { swipeAndAIsActive, spyAndBIsActive } = require('../../test-utils/global-variables/querystrings')

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

test('Animation is disabled when compare mode active', async () => {
  const { animationButtonCase, animationWidget } = selectors
  await page.goto(swipeAndAIsActive)
  await expect(animationButtonCase).toHaveClass(/wv-disabled-button/)
  const disableMessage = 'Animation feature is deactivated when Compare feature is active'
  await expect(animationButtonCase).toHaveAttribute('aria-label', disableMessage)
  await animationButtonCase.hover()
  const tooltip = page.locator('.tooltip-inner')
  await expect(tooltip).toHaveText(disableMessage)
  await animationButtonCase.click()
  await expect(animationWidget).not.toBeVisible()
})

test('Image download is disabled when compare mode active', async () => {
  const { snapshotToolbarButton } = selectors
  const disableMessage = 'You must exit comparison mode to use the snapshot feature'
  await expect(snapshotToolbarButton).toHaveClass(/disabled/)
  await expect(snapshotToolbarButton).toHaveAttribute('aria-label', disableMessage)
  await page.waitForTimeout(2000)
  await page.locator('#snapshot-btn-wrapper').click()
  const imageRes = page.locator('#wv-image-resolution')
  await expect(imageRes).not.toBeVisible()
})

test('Data download is disabled when compare mode active', async () => {
  const { dataDownloadTabButton } = selectors
  const disableMessage = 'You must exit comparison mode to download data'
  await expect(dataDownloadTabButton).toHaveClass(/disabled/)
  await expect(dataDownloadTabButton).toHaveAttribute('aria-label', disableMessage)
  const downloadTab = page.locator('#download-sidebar-tab')
  await downloadTab.hover()
  const tooltipSelector = page.locator('.tooltip-inner')
  await expect(tooltipSelector).toContainText(disableMessage)
  // Clicking does not switch tabs
  await dataDownloadTabButton.click()
  const smartHandoffPanel = page.locator('#smart-handoff-side-panel')
  await expect(smartHandoffPanel).not.toBeVisible()
})

test('Events disabled when compare mode active', async () => {
  const { eventsSidebarTabButton } = selectors
  const disableMessage = 'You must exit comparison mode to use the natural events feature'
  await eventsSidebarTabButton.click()
  const eventsContent = page.locator('#wv-eventscontent')
  await expect(eventsContent).not.toBeVisible()
  await expect(eventsSidebarTabButton).toHaveClass(/disabled/)
  await expect(eventsSidebarTabButton).toHaveAttribute('aria-label', disableMessage)
  await page.locator('#events-sidebar-tab').hover()
  const tooltipSelector = page.locator('.tooltip-inner')
  await expect(tooltipSelector).toContainText(disableMessage)
})

test('Removing layer removes correct layer from correct layer group', async () => {
  const { ModisTrueColorLayerA, ModisTrueColorLayerB, bTab } = selectors
  await expect(ModisTrueColorLayerA).toBeVisible()
  await ModisTrueColorLayerA.hover()
  const removeLayerBtn = page.locator('#close-activeMODIS_Terra_CorrectedReflectance_TrueColor')
  await removeLayerBtn.click()
  await expect(ModisTrueColorLayerA).not.toBeVisible()
  await expect(ModisTrueColorLayerB).not.toBeVisible()
  await bTab.click()
  await expect(ModisTrueColorLayerB).toBeVisible()
})

test('Collapse layer list with B state and test label shows correct number of layers', async () => {
  const { toggleButton, collapsedToggleButton } = selectors
  await page.goto(spyAndBIsActive)
  await expect(collapsedToggleButton).not.toBeVisible()
  await toggleButton.click()
  await expect(collapsedToggleButton).toBeVisible()
  const layerCount = page.locator('#accordion-toggler-button .layer-count')
  await expect(layerCount).toHaveText('6 Layers')
  await collapsedToggleButton.click()
  const referenceFeatures = page.locator('#activeB-Reference_Features_15m')
  await expect(referenceFeatures).toBeVisible()
})

test('If you exit A|B with B selection active, the active state will then be the B state', async () => {
  const { compareButton } = selectors
  const correctedReflectanceSNPP = page.locator('#activeB-VIIRS_SNPP_CorrectedReflectance_TrueColor')
  const closeReflectanceSNPP = page.locator('#close-activeBVIIRS_SNPP_CorrectedReflectance_TrueColor')
  const correctedReflectanceAqua = page.locator('#activeB-MODIS_Aqua_CorrectedReflectance_TrueColor')
  const closeReflectanceAqua = page.locator('#close-activeBMODIS_Aqua_CorrectedReflectance_TrueColor')
  const referenceLabels = page.locator('#activeB-Reference_Labels_15m')
  const closeRefLabels = page.locator('#close-activeBReference_Labels_15m')
  const referenceFeatures = page.locator('#activeB-Reference_Features_15m')
  const closeRefFeatures = page.locator('#close-activeBReference_Features_15m')
  const coastlines = page.locator('#activeB-Coastlines_15m')
  const correctedReflectanceTerra = page.locator('#activeB-MODIS_Terra_CorrectedReflectance_TrueColor')
  await expect(correctedReflectanceSNPP).toBeVisible()
  await expect(correctedReflectanceAqua).toBeVisible()
  await referenceLabels.hover()
  await closeRefLabels.click()
  await referenceFeatures.hover()
  await closeRefFeatures.click()
  await correctedReflectanceSNPP.hover()
  await closeReflectanceSNPP.click()
  await correctedReflectanceAqua.hover()
  await closeReflectanceAqua.click()
  await compareButton.click()
  await expect(coastlines).toBeVisible()
  await expect(correctedReflectanceTerra).toBeVisible()
  await expect(correctedReflectanceSNPP).not.toBeVisible()
  await expect(correctedReflectanceAqua).not.toBeVisible()
})
