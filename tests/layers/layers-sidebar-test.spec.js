// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { assertCategories, switchProjections } = require('../../test-utils/hooks/wvHooks')
const { getAttribute } = require('../../test-utils/hooks/basicHooks')

let page
let selectors

const vectorsQueryString = 'http://localhost:3000/?v=-70.43215000968726,28.678203599725197,-59.81569241792232,31.62330063930118&l=GRanD_Dams,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor'
const someGroupsQueryString = 'http://localhost:3000/?l=MODIS_Combined_Value_Added_AOD,MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth,Reference_Labels_15m(hidden),Reference_Features_15m,MODIS_Terra_CorrectedReflectance_TrueColor&lg=true'
const twoGroupsQueryString = 'http://localhost:3000/?v=-107.15747724134027,-81.6706340523014,47.81381180183274,89.12472754295932&l=VIIRS_SNPP_Thermal_Anomalies_375m_All,VIIRS_NOAA20_Thermal_Anomalies_375m_All,MODIS_Combined_Value_Added_AOD,MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth,Reference_Features_15m,MODIS_Terra_CorrectedReflectance_TrueColor&lg=true'
const mixedLayersGroupsDisabledQueryString = 'http://localhost:3000/?v=-107.15747724134027,-81.6706340523014,47.81381180183274,89.12472754295932&l=Reference_Features_15m,VIIRS_SNPP_Thermal_Anomalies_375m_All,MODIS_Combined_Value_Added_AOD,VIIRS_NOAA20_Thermal_Anomalies_375m_All,MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth,MODIS_Terra_CorrectedReflectance_TrueColor&lg=false'
const mixedLayerIdOrder = [
  'active-Reference_Features_15m',
  'active-VIIRS_SNPP_Thermal_Anomalies_375m_All',
  'active-MODIS_Combined_Value_Added_AOD',
  'active-VIIRS_NOAA20_Thermal_Anomalies_375m_All',
  'active-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth'
]
const groupedLayerIdOrder = [
  'active-Reference_Features_15m',
  'active-VIIRS_SNPP_Thermal_Anomalies_375m_All',
  'active-VIIRS_NOAA20_Thermal_Anomalies_375m_All',
  'active-MODIS_Combined_Value_Added_AOD',
  'active-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth'
]
const ungroupedReorderdLayerIdOrder = [
  'active-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth',
  'active-MODIS_Combined_Value_Added_AOD',
  'active-Reference_Features_15m',
  'active-VIIRS_SNPP_Thermal_Anomalies_375m_All',
  'active-VIIRS_NOAA20_Thermal_Anomalies_375m_All'
]

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Toggle layer Info', async () => {
  const {
    firesLayer,
    infoButton,
    infoDialog,
   } = selectors
  await page.goto(twoGroupsQueryString)
  await firesLayer.hover()
  await infoButton.click()
  await infoButton.click()
  await expect(infoDialog).not.toBeVisible()
})


test('Toggle Layer Options', async () => {
  const {
    optionsButton,
    optionsDialog
   } = selectors
   await optionsButton.click()
   await optionsButton.click()
   await expect(optionsDialog).not.toBeVisible()
})

test('Layer groups are enabled by default', async () => {
  const {
    groupCheckbox
   } = selectors
   await expect(groupCheckbox).toBeVisible()
   await expect(groupCheckbox).toBeChecked()
})

test('Adding a layer causes it to appear in the appropriate group', async () => {
  const {
    addLayers,
    layersSearchField,
    viirsFiresCheckbox,
    layersModalCloseButton,
    firesGroup,
    firesLayer
   } = selectors
  await page.goto(someGroupsQueryString)
  await addLayers.click()
  await layersSearchField.fill('fires')
  await viirsFiresCheckbox.click()
  await layersModalCloseButton.click()
  await expect(firesGroup).toBeVisible()
  await expect(firesLayer).toBeVisible()
})

test('Disabling groups puts all overlays into a single group', async () => {
  const {
    groupCheckbox,
    firesLayer,
    firesGroup,
   } = selectors
   await groupCheckbox.click()
   await expect(firesLayer).toBeVisible()
   await expect(firesGroup).not.toBeVisible()
   const overlayGroupItems = await page.locator('#active-overlays ul > li')
   await expect(overlayGroupItems).toHaveCount(5)
})

test('Re-enabling groups restores grouping', async () => {
  const {
    groupCheckbox,
    aodGroup,
   } = selectors
   await groupCheckbox.click()
   await expect(aodGroup).toBeVisible()
   const fireGroupItems = await page.locator('#active-Fires_and_Thermal_Anomalies ul > li')
   const aodGroupItems = await page.locator('#active-Aerosol_Optical_Depth ul > li')
   await expect(fireGroupItems).toHaveCount(1)
   await expect(aodGroupItems).toHaveCount(2)
})

test('Removing the last layer in a group removes the group', async () => {
  const {
    firesLayer,
    firesRemove,
    firesGroup
   } = selectors
   await firesLayer.hover()
   await firesRemove.click()
   await expect(firesGroup).not.toBeVisible()
})

test('Removing a group removes all layers and the group header', async () => {
  const {
    aodGroupHeader,
    aodGroup
   } = selectors
   await page.goto(twoGroupsQueryString)
   await aodGroupHeader.hover()
   await page.locator('#active-Aerosol_Optical_Depth .layer-group-more-options > button').click()
   await page.locator('#active-Aerosol_Optical_Depth .layer-group-more-options #remove-group').click()
   await expect(aodGroup).not.toBeVisible()
})

test('Load with groups disabled from permalink', async () => {
  const {
    groupCheckbox,
    firesGroup,
    aodGroup,
    overlaysGroup
   } = selectors
   await page.goto(mixedLayersGroupsDisabledQueryString)
   await expect(groupCheckbox).toBeVisible()
   await expect(groupCheckbox).not.toBeChecked()
   await expect(firesGroup).not.toBeVisible()
   await expect(aodGroup).not.toBeVisible()
   await expect(overlaysGroup).toBeVisible()
   const overlayGroupItems = await page.locator('#active-overlays ul > li')
   await expect(overlayGroupItems).toHaveCount(5)
})

test.only('Load multiple groups from permalink', async () => {
  const {
    groupCheckbox,
    firesGroup,
    aodGroup,
   } = selectors
   await page.goto(twoGroupsQueryString)
   await expect(groupCheckbox).toBeVisible()
   await expect(groupCheckbox).toBeChecked()
   await expect(firesGroup).toBeVisible()
   await expect(aodGroup).toBeVisible()
   const fireGroupItems = await page.locator('#active-Fires_and_Thermal_Anomalies ul > li')
   const aodGroupItems = await page.locator('#active-Aerosol_Optical_Depth ul > li')
   await expect(fireGroupItems).toHaveCount(2)
   await expect(aodGroupItems).toHaveCount(2)
})

test.only('Hide all...', async () => {
  const {
    sidebarContainer,
    aodGroupHeader,
   } = selectors
   await sidebarContainer.hover()
   await aodGroupHeader.hover()
   await page.locator('#active-Aerosol_Optical_Depth .layer-group-more-options > button').click()
   await page.locator('#active-Aerosol_Optical_Depth .layer-group-more-options #hide-all').click()
   const aodGroupHiddenLayers = await page.locator('#active-Aerosol_Optical_Depth li.layer-hidden')
   const aodGroupVisibleLayers = await page.locator('#active-Aerosol_Optical_Depth li.layer-visible')
   await expect(aodGroupHiddenLayers).toHaveCount(2)
   await expect(aodGroupVisibleLayers).toHaveCount(0)
})

test.only('Show all...', async () => {
  const {
    sidebarContainer,
    aodGroupHeader,
   } = selectors
   await sidebarContainer.hover()
   await aodGroupHeader.hover()
   await page.locator('#active-Aerosol_Optical_Depth .layer-group-more-options > button').click()
   await page.locator('#active-Aerosol_Optical_Depth .layer-group-more-options #show-all').click()
   const aodGroupHiddenLayers = await page.locator('#active-Aerosol_Optical_Depth li.layer-hidden')
   const aodGroupVisibleLayers = await page.locator('#active-Aerosol_Optical_Depth li.layer-visible')
   await expect(aodGroupHiddenLayers).toHaveCount(0)
   await expect(aodGroupVisibleLayers).toHaveCount(2)
})

test.only('Ungrouped: Removing baselayers/overlays removes the layers but not the header', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Baselayers group options button does not appear on hover in testing for Safari')
  const {
    groupCheckbox,
    firesLayer,
    overlaysGroupHeader,
    baselayersGroupHeader,
    overlaysGroup,
    baselayersGroup
   } = selectors
   await groupCheckbox.click()
  //  const groupOverlaysCheckbox = await page.locator('#group-overlays-checkbox')
  //  await expect(groupOverlaysCheckbox).not.toBeChecked()
   await firesLayer.hover()
   await overlaysGroupHeader.hover()
   await page.locator('#active-overlays .layer-group-header .layer-group-more-options > button').click()
   await page.locator('#active-overlays .layer-group-header .layer-group-more-options #remove-group').click()

   await baselayersGroupHeader.hover()
   await page.locator('#active-baselayers .layer-group-header .layer-group-more-options > button').click()
   await page.locator('#active-baselayers .layer-group-header .layer-group-more-options #remove-group').click()
   await expect(overlaysGroup).toBeVisible()
   const overlayGroupItems = page.locator('#active-overlays ul > li')
   await expect(overlayGroupItems).toHaveCount(0)
   await expect(baselayersGroup).toBeVisible()
   const baseLayerGroupItems = page.locator('#active-baselayers ul > li')
   await expect(baseLayerGroupItems).toHaveCount(0)
})
