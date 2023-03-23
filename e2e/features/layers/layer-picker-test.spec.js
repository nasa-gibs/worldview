// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { assertCategories, switchProjections } = require('../../test-utils/hooks/wvHooks')

let page
let selectors

const url = 'http://localhost:3000/?t=2013-05-15'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Layer picker shows categories when first opened', async () => {
  const { addLayers } = selectors
  await page.goto(url)
  await addLayers.click()
  await assertCategories(page)
})

test('Enabled Corrected Reflectance layers are shown as checked', async () => {
  const { allCategoryHeader, correctedReflectanceChecked } = selectors
  await allCategoryHeader.click()
  await page.locator('#accordion-legacy-all-corrected-reflectance').click()
  await expect(correctedReflectanceChecked).toBeVisible()
})

test('"Unavailable" layers show unavailable icon and tooltip', async () => {
  const { weldUnavailableTooltipIcon } = selectors
  await page.locator('#landsat-weld-1-source-Nav').click()
  await weldUnavailableTooltipIcon.hover()
  const tooltip = await page.locator('.tooltip')
  await expect(tooltip).toBeVisible()
})

test('Entering search text transitions to search mode', async () => {
  const { layersSearchField, layersSearchRow } = selectors
  await layersSearchField.fill('ozone')
  await expect(layersSearchRow).toHaveCount(6)
})

test('Updating input changes results', async () => {
  const { layersSearchField, layersSearchRow } = selectors
  await layersSearchField.clear()
  await layersSearchField.fill('ozone day')
  await expect(layersSearchRow).toHaveCount(1)
})

test('Selecting a row shows the detail panel', async () => {
  const { layerDetailHeader } = selectors
  await page.locator('#MLS_O3_46hPa_Day-search-row').click()
  await expect(layerDetailHeader).toBeVisible()
})

test('Add layer button and list item checbox are in sync', async () => {
  const { addToMapButton } = selectors
  const checkBox = await page.locator('.search-row.layers-all-layer.selected .wv-checkbox')
  await addToMapButton.click()
  await expect(checkBox).toHaveClass(/checked/)
  await expect(addToMapButton).toContainText('Remove Layer')
  await checkBox.click()
  await expect(addToMapButton).toContainText('Add Layer')
  await expect(checkBox).not.toHaveClass('checked')
})

test('Search for "nothing" returns no results', async () => {
  const { layersSearchField } = selectors
  await layersSearchField.clear()
  await layersSearchField.fill('nothing')
  const noResults = await page.locator('.no-results')
  await expect(noResults).toContainText('No layers found!')
})

test('"Available 2013 May 15" filter removes items not available from list, adds a chip', async () => {
  const {
    layersSearchField,
    coverageTooltipIcon,
    layerPickerBackButton,
    availableFilterCheckbox,
    layersSearchRow,
    layerResultsCountText
  } = selectors
  await layersSearchField.clear()
  await layersSearchField.fill('(True')
  await coverageTooltipIcon.hover()
  const tooltip = await page.locator('.tooltip')
  await expect(tooltip).toBeVisible()
  await layerPickerBackButton.hover()
  await availableFilterCheckbox.click()
  await expect(layersSearchRow).toHaveCount(4)
  await expect(layerResultsCountText).toContainText('Showing 4 out of')
  const filterChip = await page.locator('.filter-chip')
  await expect(filterChip).toHaveCount(1)
})

test('Closing and reopening layer picker restores state.', async () => {
  const {
    layersSearchRow,
    layerDetailHeader,
    layersModalCloseButton,
    layersAll,
    addLayers,
    layerResultsCountText,
    layerDetails,
    layerDetailsDateRange
  } = selectors
  await page.locator('.product-outter-list-case .search-row:nth-child(1)').click()
  await expect(layerDetailHeader).toContainText('Corrected Reflectance')
  await layersModalCloseButton.click()
  await expect(layersAll).not.toBeVisible()
  await addLayers.click()
  await expect(layersSearchRow).toHaveCount(4)
  await expect(layerResultsCountText).toContainText('Showing 4 out of')
  await expect(layerDetails).toBeVisible()
  await expect(layerDetailHeader).toContainText('Corrected Reflectance')
  await expect(layerDetailsDateRange).toBeVisible()
  const filterChip = await page.locator('.filter-chip')
  await expect(filterChip).toHaveCount(1)
})

test('Changing app date is reflected in coverage facets', async () => {
  const {
    layersModalCloseButton,
    yearDown,
    monthDown,
    dayDown,
    addLayers,
    availableFilterTextEl,
    availableFilterCheckboxInput
  } = selectors
  await layersModalCloseButton.click()
  await yearDown.click()
  await monthDown.click()
  await dayDown.click()
  await addLayers.click()
  await expect(availableFilterTextEl).toContainText('Available 2012 APR 14')
  await expect(availableFilterCheckboxInput).toBeChecked()
})

test('Disabling coverage filter updates list', async () => {
  const {
    availableFilterCheckbox,
    availableFilterCheckboxInput,
    layersSearchRow,
    layerResultsCountText
  } = selectors
  await availableFilterCheckbox.click()
  await expect(availableFilterCheckboxInput).not.toBeChecked()
  await expect(layersSearchRow).toHaveCount(10)
  await expect(layerResultsCountText).toContainText('Showing 10 out of')
})

test('Finding layer by ID with search', async () => {
  const { layersSearchField, layersAll } = selectors
  await layersSearchField.clear()
  await layersSearchField.fill('MERRA2_Total_Aerosol_Optical_Thickness_550nm_Scattering_Monthly')
  await page.waitForTimeout(300)
  await expect(layersAll).toContainText('Total Aerosol Optical Thickness Scattering 550nm')
  await expect(layersAll).toContainText('MERRA-2')
})

test('Back button returns to main selection but retains search input', async () => {
  const { layerPickerBackButton, layersSearchField } = selectors
  await layerPickerBackButton.click()
  const searchText = await layersSearchField.inputValue()
  expect(searchText).toEqual('MERRA2_Total_Aerosol_Optical_Thickness_550nm_Scattering_Monthly')
  await assertCategories(page)
})

test('Switching to "Science Disciplines" tab updates category/measurement choices', async () => {
  const { scienceDisciplinesTab } = selectors
  const scientificAll = await page.locator('#scientific-all')
  const atmosphere = await page.locator('#atmosphere')
  const biosphere = await page.locator('#biosphere')
  const cryosphere = await page.locator('#cryosphere')
  const humanDimensions = await page.locator('#human-dimensions')
  const landSurface = await page.locator('#land-surface')
  const oceans = await page.locator('#oceans')
  const spectralEngineering = await page.locator('#spectral-engineering')
  const terrestrialHydrosphere = await page.locator('#terrestrial-hydrosphere')
  const scientificOther = await page.locator('#scientific-other')
  await scienceDisciplinesTab.click()
  await expect(scientificAll).toBeVisible()
  await expect(atmosphere).toBeVisible()
  await expect(biosphere).toBeVisible()
  await expect(cryosphere).toBeVisible()
  await expect(humanDimensions).toBeVisible()
  await expect(landSurface).toBeVisible()
  await expect(oceans).toBeVisible()
  await expect(spectralEngineering).toBeVisible()
  await expect(terrestrialHydrosphere).toBeVisible()
  await expect(scientificOther).toBeVisible()
})

test('Selecting a measurement from the grid shows sources and details for first source', async () => {
  const {
    aodMeasurement,
    layerDetailHeader,
    aodCheckboxMODIS,
    aodCheckboxMAIAC
  } = selectors
  await aodMeasurement.click()
  await expect(layerDetailHeader).toContainText('Aqua and Terra/MODIS')
  await expect(aodCheckboxMODIS).toBeVisible()
  await expect(aodCheckboxMAIAC).toBeVisible()
  const modisAvailableCoverage = page.locator('#MODIS_Combined_Value_Added_AOD-checkbox + svg#availability-info')
  const maiacAvailableCoverage = page.locator('#MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth-checkbox + svg#availability-info')
  await expect(modisAvailableCoverage).toBeVisible()
  await expect(maiacAvailableCoverage).toBeVisible()
})

test('Available grid source layer measuremet does not have unavaiable coverage icon', async () => {
  const {
    aquaModisTab,
    layerDetailHeader,
    aodCheckboxAquaMODIS,
    aquaTerraMODISTab
  } = selectors
  await aquaModisTab.click()
  await expect(layerDetailHeader).toContainText('Aqua/MODIS')
  await expect(aodCheckboxAquaMODIS).toBeVisible()
  const modisAvailabilityInfo = await page.locator('#MODIS_Combined_Value_Added_AOD-checkbox + svg#availability-info')
  await expect(modisAvailabilityInfo).not.toBeVisible()
  await aquaTerraMODISTab.click()
})

test('Selecting layers from product picker adds them to the sidebar/map', async () => {
  const {
    aodCheckboxMODIS,
    aodCheckboxMAIAC,
    layerPickerBackButton,
    layersModalCloseButton,
    aodSidebarLayer,
    aodMAIACSidebarLayer
  } = selectors
  await aodCheckboxMODIS.click()
  await aodCheckboxMAIAC.click()
  await layerPickerBackButton.click()
  await layersModalCloseButton.click()
  await expect(aodSidebarLayer).toBeVisible()
  await expect(aodMAIACSidebarLayer).toBeVisible()
})

test('Collapsed sidebar shows updated layer count', async () => {
  const { collapsedLayerButton } = selectors
  await page.locator('#toggleIconHolder').click()
  const layerCount = await page.locator('.layer-count')
  await expect(layerCount).toContainText('9 Layers')
  await collapsedLayerButton.click()
})

test('When switching arctic projection, go straight to measurements browse list if previously in category mode', async () => {
  const { addLayers, layerBrowseDetail } = selectors
  await switchProjections(page, 'arctic')
  await addLayers.click()
  await expect(layerBrowseDetail).toBeVisible()
  const noResults = await page.locator('.no-results')
  await expect(noResults).toContainText('Select a measurement to view details here!')
})

test('Searching in arctic projection', async () => {
  const {
    layersSearchField,
    layersSearchRow,
    layerResultsCountText,
    layerPickerBackButton,
    layerBrowseDetail,
    layersModalCloseButton
  } = selectors
  await layersSearchField.fill('sea')
  await expect(layersSearchRow).toHaveCount(15)
  await expect(layerResultsCountText).toContainText('Showing 15 out of')
  await layerPickerBackButton.click()
  await expect(layerBrowseDetail).toBeVisible()
  await layersModalCloseButton.click()
})

test('Switching back to geographic projetion, categories appear', async () => {
  const { addLayers } = selectors
  await switchProjections(page, 'geographic')
  await addLayers.click()
  await assertCategories(page)
})
