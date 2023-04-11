// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { assertLayerOrdering } = require('../../test-utils/hooks/wvHooks')

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
  'active-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth',
  'active-MODIS_Terra_CorrectedReflectance_TrueColor'
]
const ungroupedReorderdLayerIdOrder = [
  'active-MODIS_Combined_Value_Added_AOD',
  'active-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth',
  'active-VIIRS_SNPP_Thermal_Anomalies_375m_All',
  'active-VIIRS_NOAA20_Thermal_Anomalies_375m_All',
  'active-Reference_Features_15m'
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
    infoDialog
  } = selectors
  await page.goto(twoGroupsQueryString)
  await firesLayer.hover()
  await infoButton.click()
  await infoButton.click()
  await expect(infoDialog).not.toBeVisible()
})

test('Toggle Layer Options', async () => {
  const { optionsButton, optionsDialog } = selectors
  await optionsButton.click()
  await optionsButton.click()
  await expect(optionsDialog).not.toBeVisible()
})

test('Layer groups are enabled by default', async () => {
  const { groupCheckbox } = selectors
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
    firesGroup
  } = selectors
  await groupCheckbox.click()
  await expect(firesLayer).toBeVisible()
  await expect(firesGroup).not.toBeVisible()
  const overlayGroupItems = await page.locator('#active-overlays ul > li')
  await expect(overlayGroupItems).toHaveCount(5)
})

test('Re-enabling groups restores grouping', async () => {
  const { groupCheckbox, aodGroup } = selectors
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
  const { aodGroupHeader, aodGroup } = selectors
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

test('Load multiple groups from permalink', async () => {
  const {
    groupCheckbox,
    firesGroup,
    aodGroup
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

test('Hide all...', async () => {
  const { sidebarContainer, aodGroupHeader } = selectors
  await sidebarContainer.hover()
  await aodGroupHeader.hover()
  await page.locator('#active-Aerosol_Optical_Depth .layer-group-more-options > button').click()
  await page.locator('#active-Aerosol_Optical_Depth .layer-group-more-options #hide-all').click()
  const aodGroupHiddenLayers = await page.locator('#active-Aerosol_Optical_Depth li.layer-hidden')
  const aodGroupVisibleLayers = await page.locator('#active-Aerosol_Optical_Depth li.layer-visible')
  await expect(aodGroupHiddenLayers).toHaveCount(2)
  await expect(aodGroupVisibleLayers).toHaveCount(0)
})

test('Show all...', async () => {
  const { sidebarContainer, aodGroupHeader } = selectors
  await sidebarContainer.hover()
  await aodGroupHeader.hover()
  await page.locator('#active-Aerosol_Optical_Depth .layer-group-more-options > button').click()
  await page.locator('#active-Aerosol_Optical_Depth .layer-group-more-options #show-all').click()
  const aodGroupHiddenLayers = await page.locator('#active-Aerosol_Optical_Depth li.layer-hidden')
  const aodGroupVisibleLayers = await page.locator('#active-Aerosol_Optical_Depth li.layer-visible')
  await expect(aodGroupHiddenLayers).toHaveCount(0)
  await expect(aodGroupVisibleLayers).toHaveCount(2)
})

test('Ungrouped: Removing baselayers/overlays removes the layers but not the header', async () => {
  const {
    groupCheckbox,
    firesLayer,
    overlaysGroupHeader,
    overlaysGroup
  } = selectors
  await groupCheckbox.click()
  await firesLayer.hover()
  await overlaysGroupHeader.hover()
  await page.locator('#active-overlays .layer-group-more-options > button').click()
  await page.locator('#active-overlays .layer-group-more-options #remove-group').click()
  await expect(overlaysGroup).toBeVisible()
  const overlayGroupItems = page.locator('#active-overlays ul > li')
  await expect(overlayGroupItems).toHaveCount(0)
})

test('Re-ordering groups, then disabling groups keeps individual layer order', async () => {
  const {
    aodGroupHeader,
    firesGroupHeader,
    groupCheckbox
  } = selectors
  await page.goto(twoGroupsQueryString)
  const aodBoundingBox = await aodGroupHeader.boundingBox()
  const firesBoundingBox = await firesGroupHeader.boundingBox()
  // this 'steps' option is important for making the drag action work with the 'react-draggable' library
  await page.mouse.move(
    aodBoundingBox.x,
    aodBoundingBox.y,
    { steps: 10 }
  )
  await page.mouse.down()
  const x = firesBoundingBox.x + firesBoundingBox.width / 2
  const y = firesBoundingBox.y + firesBoundingBox.height / 2
  await page.mouse.move(x, y, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  await groupCheckbox.click()
  const layersContainer = '#active-overlays li'
  await assertLayerOrdering(page, layersContainer, ungroupedReorderdLayerIdOrder)
})

test('Enabling groups re-orders layers into their groups', async () => {
  const {
    aodGroup,
    firesGroup,
    groupCheckbox
  } = selectors
  await page.goto(mixedLayersGroupsDisabledQueryString)
  const layersContainer = '#active-overlays li'
  await assertLayerOrdering(page, layersContainer, mixedLayerIdOrder)
  await groupCheckbox.click()
  await expect(aodGroup).toBeVisible()
  await expect(firesGroup).toBeVisible()
  const groupedLayersContainer = '.layer-container ul .productsitem'
  await assertLayerOrdering(page, groupedLayersContainer, groupedLayerIdOrder)
})

test('Immediately disabling groups restores mixed ordering', async () => {
  const {
    aodGroup,
    firesGroup,
    groupCheckbox
  } = selectors
  await groupCheckbox.click()
  await expect(aodGroup).not.toBeVisible()
  await expect(firesGroup).not.toBeVisible()
  const layersContainer = '#active-overlays li'
  await assertLayerOrdering(page, layersContainer, mixedLayerIdOrder)
})

test('Making a change to grouped layers causes group ordering to be retained when ungrouped', async () => {
  const { groupCheckbox, aodGroupHeader } = selectors
  await page.goto(mixedLayersGroupsDisabledQueryString)
  await groupCheckbox.click()
  await aodGroupHeader.hover()
  await page.locator('#active-Aerosol_Optical_Depth .layer-group-more-options > button').click()
  await page.locator('#active-Aerosol_Optical_Depth .layer-group-more-options #hide-all').click()
  await groupCheckbox.click()
  const groupedLayersContainer = '.layer-container ul .productsitem'
  await assertLayerOrdering(page, groupedLayersContainer, groupedLayerIdOrder)
})

test('Vector layer has pointer icon & clicking vector layer pointer shows modal', async () => {
  await page.goto(vectorsQueryString)
  const handPointer = await page.locator('#active-GRanD_Dams .fa-hand-pointer')
  await expect(handPointer).toBeVisible()
  await handPointer.click()
  const modalContent = await page.locator('.modal-content')
  await expect(modalContent).toContainText('Vector features may not be clickable at all zoom levels.')
})
