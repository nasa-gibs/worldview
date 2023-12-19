// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { swipeAndAIsActive } = require('../../test-utils/global-variables/querystrings')

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

test('Add AOD Layer to Layer Group A', async () => {
  const {
    addLayers,
    layersAll3rdElement,
    layersList1stCheckbox,
    layersModalCloseButton
  } = selectors
  await page.goto(swipeAndAIsActive)
  await addLayers.click()
  await layersAll3rdElement.click()
  await layersList1stCheckbox.click()
  await layersModalCloseButton.click()
  const layerPicker = page.locator('#layer_picker_component')
  await expect(layerPicker).not.toBeVisible()
})

test('Add AOD index layer to Active state B and verify it has been added', async () => {
  const {
    addLayers,
    layersList1stCheckbox
  } = selectors
  await page.locator('.ab-tabs-case .ab-tab.second-tab .productsIcon').click()
  const aodLayerA = page.locator('active-MODIS_Combined_Value_Added_AOD')
  const aodLayerB = page.locator('activeB-MODIS_Combined_Value_Added_AOD')
  await expect(aodLayerA).not.toBeVisible()
  await addLayers.click()
  await layersList1stCheckbox.click()
  await expect(aodLayerA).not.toBeVisible()
  await expect(aodLayerB).not.toBeVisible()
})

test('Verify that AOD combined is visible and AOD index is not present in Layer list A', async () => {
  const {
    aTab,
    layersModalCloseButton
  } = selectors
  await layersModalCloseButton.click()
  await aTab.click()
  const aodMAIACIdA = page.locator('active-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth')
  const aodLayerB = page.locator('activeB-MODIS_Combined_Value_Added_AOD')
  await expect(aodMAIACIdA).not.toBeVisible()
  await expect(aodLayerB).not.toBeVisible()
})
