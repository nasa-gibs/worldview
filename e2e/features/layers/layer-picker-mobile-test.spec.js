// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { assertDefaultLayers, assertCategories } = require('../../test-utils/hooks/wvHooks')

let page
let selectors

const url = 'http://localhost:3000/?t=2013-05-15'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  })
  page = await context.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Initial state indicates layer count', async () => {
  const { layerCount } = selectors
  await page.goto(url)
  await expect(layerCount).toBeVisible()
  await expect(layerCount).toContainText('7')
})

test('Expand layer list and show default layers', async () => {
  const { collapsedLayerButton } = selectors
  await collapsedLayerButton.click()
  await assertDefaultLayers(page)
})

test('Open product picker and show categories by default', async () => {
  const { addLayers } = selectors
  await addLayers.click()
  await assertCategories(page)
})

test('Clicking a measurement shows choices, indicates unavailability', async () => {
  const {
    aodAllMeasurement,
    sourceMetadataCollapsed,
    aodCheckboxMAIAC,
    aodCheckboxMODIS,
    sourceTabs
  } = selectors
  await aodAllMeasurement.click()
  await expect(sourceMetadataCollapsed).toBeVisible()
  await expect(aodCheckboxMAIAC).toBeVisible()
  await expect(aodCheckboxMODIS).toBeVisible()
  const modisAvailableCoverage = page.locator('#MODIS_Combined_Value_Added_AOD-checkbox + svg#availability-info')
  const maiacAvailableCoverage = page.locator('#MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth-checkbox + svg#availability-info')
  await expect(modisAvailableCoverage).toBeVisible()
  await expect(maiacAvailableCoverage).toBeVisible()
  await expect(sourceTabs).toHaveCount(8)
})

test('Available grid source layer measuremet does not have unavaiable coverage class', async () => {
  const {
    aquaTerraMODISTab,
    aquaModisTab,
    aodCheckbox
  } = selectors
  await aquaTerraMODISTab.click()
  await aquaModisTab.click()
  await expect(aodCheckbox).toBeVisible()
  await expect(aodCheckbox).not.toHaveClass('unavailable')
  await aquaTerraMODISTab.click()
})

test('Expanding and collapsing measurement details', async () => {
  const { aquaTerraModisHeader, sourceMetadataExpanded } = selectors
  await page.locator('.ellipsis').click()
  await expect(aquaTerraModisHeader).toContainText('About Aerosol Optical Depth (AOD)')
  const ellipsis = page.locator('.ellipsis.up')
  await expect(ellipsis).toBeVisible()
  await ellipsis.click()
  await expect(sourceMetadataExpanded).toHaveClass(/overflow/)
})

test('Switching source tabs', async () => {
  const {
    aquaTerraModisHeader,
    aquaModisTab,
    aodCheckbox
  } = selectors
  await aquaModisTab.click()
  await expect(aodCheckbox).toBeVisible()
  await expect(aquaTerraModisHeader).toBeVisible()
  await expect(aquaTerraModisHeader).toContainText('About Aerosol Optical Depth (AOD)')
  await aodCheckbox.click()
})

test('Back button returns to categories', async () => {
  const { layerPickerBackButton } = selectors
  await layerPickerBackButton.click()
  await assertCategories(page)
})

test('Switch to facet view and confirm applying facets limits results', async () => {
  const {
    layerFilterButton,
    availableFacetLabel,
    categoryAtmosphereLabel,
    categoryFacetCollapseToggle,
    categoryFacetChoicesContainer,
    measurementFacetChoices,
    measurementMoreButton,
    measurementTemperatureLabel,
    sourcesMERRALabel,
    applyButton,
    layersSearchRow,
    resetButton
  } = selectors
  await layerFilterButton.click()
  await availableFacetLabel.click()
  await categoryAtmosphereLabel.click()
  await categoryFacetCollapseToggle.click()
  await expect(categoryFacetChoicesContainer).not.toBeVisible()
  await expect(measurementFacetChoices).toHaveCount(5)
  await measurementMoreButton.click()
  await expect(measurementFacetChoices).toHaveCount(15)
  await measurementTemperatureLabel.click()
  await sourcesMERRALabel.click()
  await applyButton.click()
  await expect(layersSearchRow).toHaveCount(4)
  await resetButton.click()
})

test('Searching for layers', async () => {
  const {
    layersSearchField,
    layersSearchRow,
    aodCheckbox
  } = selectors
  await layersSearchField.fill('aerosol optical depth')
  await expect(layersSearchRow).toHaveCount(17)
  await expect(aodCheckbox).toBeVisible()
})

test('Viewing details for search results', async () => {
  const {
    aodSearchRow,
    layerDetailHeader,
    addToMapButton
  } = selectors
  await aodSearchRow.click()
  await expect(layerDetailHeader).toContainText('Aerosol Optical Depth')
  await expect(addToMapButton).toContainText('Remove Layer')
})

test('Add to layer button and checkbox are in sync', async () => {
  const {
    addToMapButton,
    aodSearchCheckbox,
    aodCheckbox
  } = selectors
  await addToMapButton.click()
  await expect(aodSearchCheckbox).not.toHaveClass('checked')
  await expect(addToMapButton).toContainText('Add Layer')
  await aodCheckbox.click()
  await expect(addToMapButton).toContainText('Remove Layer')
  await expect(aodSearchCheckbox).toHaveClass(/checked/)
})

test('Clicking the selected row deselects it and hides the details', async () => {
  const { aodSearchRow, layerDetails } = selectors
  await aodSearchRow.click()
  await expect(layerDetails).not.toBeVisible()
  await aodSearchRow.click()
  await expect(aodSearchRow).toHaveClass(/selected/)
})

test('Close product picker and confirm added layers show in sidebar', async () => {
  const { layersModalCloseButton } = selectors
  await layersModalCloseButton.click()
  const activeLayer = page.locator('#active-MODIS_Aqua_Aerosol')
  await expect(activeLayer).toBeVisible()
})

test('Collapse sidebar and confirm layer count updated', async () => {
  const { layerCount } = selectors
  await page.locator('#toggleIconHolder').click()
  await expect(layerCount).toContainText('8')
})
