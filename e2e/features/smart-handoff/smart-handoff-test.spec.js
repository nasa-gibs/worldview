// @ts-check
const { test, expect } = require('@playwright/test')
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

test('Data tab is available and in default state when clicked', async () => {
  const { dataDownloadTabButton } = selectors
  const queryString = 'http://localhost:3000/?l=Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m&t=2019-12-01'
  const handoffTitle = await page.locator('.smart-handoff-side-panel > h1')
  await page.goto(queryString)
  await expect(dataDownloadTabButton).toBeVisible()
  await dataDownloadTabButton.click()
  await page.waitForTimeout(5000)
  await expect(handoffTitle).toContainText('None of your current layers are available for download.')
})

test('Select "Cloud Effective Radius" layer and check that it is available for download', async () => {
  const {
    addLayers,
    allCategoryHeader,
    layersTab,
    layersModalCloseButton,
    dataDownloadTabButton
  } = selectors
  await layersTab.click()
  await addLayers.click()
  await allCategoryHeader.click()
  await page.locator('#accordion-legacy-all-cloud-effective-radius').click()
  await page.locator('#MODIS_Aqua_Cloud_Effective_Radius-checkbox').click()
  await layersModalCloseButton.click()
  await dataDownloadTabButton.click()
  await page.locator('#C1443536017-LAADS-MODIS_Aqua_Cloud_Effective_Radius-collection-choice-label').click()
  const granuleCountHeader = await page.locator('.granule-count-header')
  const granuleCountInfo = await page.locator('.granule-count-info')
  await expect(granuleCountHeader).toContainText('Available granules for 2019 DEC 01:')
  await expect(granuleCountInfo).toBeVisible()
  await page.locator('#chk-crop-toggle').click()
  await expect(granuleCountInfo).toBeVisible()
})

test('Arriving via permalink, data tab selected and granule count shows', async () => {
  const { dataDownloadTabButton } = selectors
  const permalinkParams = 'http://localhost:3000/?l=GHRSST_L4_MUR_Sea_Surface_Temperature,MODIS_Aqua_Aerosol_Optical_Depth_3km&lg=true&sh=MODIS_Aqua_Aerosol_Optical_Depth_3km,C1443528505-LAADS&t=2020-02-06-T06%3A00%3A00Z'
  await page.goto(permalinkParams)
  await dataDownloadTabButton.click()
  const granuleCountInfo = await page.locator('.granule-count-info')
  await expect(granuleCountInfo).not.toHaveText('NONE')
})

test('Changing collection updates URL', async () => {
  await page.getByLabel('Standard - v4.1').check()
  const url = await page.url()
  expect(url).toContain('&sh=GHRSST_L4_MUR_Sea_Surface_Temperature')
})

test('Layers outside of their coverage date range are hidden from layers available for download', async () => {
  const { dataDownloadTabButton } = selectors
  const permalinkParams1980 = 'http://localhost:3000/?l=GHRSST_L4_MUR_Sea_Surface_Temperature,MODIS_Aqua_Aerosol_Optical_Depth_3km&lg=true&sh=MODIS_Aqua_Aerosol_Optical_Depth_3km,C1443528505-LAADS&t=1980-02-06-T06%3A00%3A00Z'
  await page.goto(permalinkParams1980)
  await expect(dataDownloadTabButton).toBeVisible()
  const smartHandoffTitle = await page.locator('.smart-handoff-side-panel > h1')
  await expect(smartHandoffTitle).toContainText('None of your current layers are available for download.')
})

test('Map extent entirely across dateline disables download button and displays warning for user to zoom out to see available map', async () => {
  const extentCrossedDateline = 'http://localhost:3000/?v=226.32336353630282,-35.84415340249873,233.47009302183025,-31.309041515170094&l=VIIRS_NOAA20_Thermal_Anomalies_375m_All,Coastlines_15m,MODIS_Terra_CorrectedReflectance_TrueColor&lg=false&sh=VIIRS_NOAA20_Thermal_Anomalies_375m_All,C1355615368-LANCEMODIS&t=2021-08-29-T17%3A56%3A03Z'
  await page.goto(extentCrossedDateline)
  const downloadButton = await page.locator('.download-btn')
  await expect(downloadButton).toBeVisible()
  await expect(downloadButton).toHaveClass(/wv-disabled/)
  const alertMessage = await page.locator('#data-download-unavailable-dateline-alert div.wv-alert-message')
  await expect(alertMessage).toContainText('The map is zoomed into an area with no available data.')
})

test('Download via Earthdata Search', async () => {
  const permalinkParams = 'http://localhost:3000/?l=GHRSST_L4_MUR_Sea_Surface_Temperature,MODIS_Aqua_Aerosol_Optical_Depth_3km&lg=true&sh=MODIS_Aqua_Aerosol_Optical_Depth_3km,C1443528505-LAADS&t=2020-02-06-T06%3A00%3A00Z'
  await page.goto(permalinkParams)
  await page.locator('.download-btn').click()
  const transferring = await page.locator('#transferring-to-earthdata-search')
  await expect(transferring).toBeVisible()
})
