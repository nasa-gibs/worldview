// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { swipeAndAIsActive } = require('../../test-utils/global-variables/querystrings')

let page
let selectors
let aodCheckBox
let aodMAIACCheckbox

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
  aodCheckBox = page.locator('#MODIS_Combined_Value_Added_AOD-checkbox')
  aodMAIACCheckbox = page.locator('#checkbox-case-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth .wv-checkbox input')
})

test.afterAll(async () => {
  await page.close()
})

test('Add AOD Layer to Layer Group A', async () => {
  const {
    addLayers,
    aerosolOpticalDepth,
    layersModalCloseButton
  } = selectors
  await page.goto(swipeAndAIsActive)
  await addLayers.click()
  await aerosolOpticalDepth.click()
  await aodCheckBox.click()
  await layersModalCloseButton.click()
  const layerPicker = page.locator('#layer_picker_component')
  await expect(layerPicker).not.toBeVisible()
})

test('Add AOD index layer to Active state B and verify it has been added', async () => {
  const { addLayers } = selectors
  await page.locator('.ab-tabs-case .ab-tab.second-tab .productsIcon').click()
  const aodLayerA = page.locator('active-MODIS_Combined_Value_Added_AOD')
  const aodLayerB = page.locator('activeB-MODIS_Combined_Value_Added_AOD')
  await expect(aodLayerA).not.toBeVisible()
  await addLayers.click()
  await aodMAIACCheckbox.click()
  await expect(aodLayerA).not.toBeVisible()
  await expect(aodLayerB).not.toBeVisible()
})

test('Verify that AOD combined is visible and AOD index is not present in Layer list A', async () => {
  const { aTab, layersModalCloseButton } = selectors
  await layersModalCloseButton.click()
  await aTab.click()
  const aodMAIACIdA = page.locator('active-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth')
  const aodLayerB = page.locator('activeB-MODIS_Combined_Value_Added_AOD')
  await expect(aodMAIACIdA).not.toBeVisible()
  await expect(aodLayerB).not.toBeVisible()
})
