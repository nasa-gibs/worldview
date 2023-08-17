// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { swipeAndAIsActive, multipleDataLayers, referenceLayersOnly } = require('../../test-utils/global-variables/querystrings')

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

test('Charting button disabled by default', async () => {
  const { chartingButton } = selectors
  await page.goto(referenceLayersOnly)
  const isChartingEnabled = await page.$('#chart-toggle-button')
  if (isChartingEnabled) {
    await expect(chartingButton).toHaveClass(/disabled/)
  }
})

test('Comparison button is hidden when Charting mode active', async () => {
  const { compareButton } = selectors
  await page.goto(multipleDataLayers)
  const isChartingEnabled = await page.$('#chart-toggle-button')
  if (isChartingEnabled) {
    await page.locator('#chart-toggle-button').click()
    await expect(compareButton).toHaveCount(0)
    await page.locator('#chart-toggle-button').click()
  }
})

test('Charting mode is hidden when Compare mode active', async () => {
  const { chartingButton } = selectors
  await page.goto(swipeAndAIsActive)
  const isChartingEnabled = await page.$('#chart-toggle-button')
  if (isChartingEnabled) {
    await expect(chartingButton).toHaveCount(0)
  }
})

test('`Exit Charting` button is available in Charting mode', async () => {
  const { chartingButton } = selectors
  await page.goto(multipleDataLayers)
  const isChartingEnabled = await page.$('#chart-toggle-button')
  if (isChartingEnabled) {
    await page.locator('#chart-toggle-button').click()
    await expect(chartingButton).toHaveText('Exit Charting')
  }
})

test('Entering & exiting Charting Mode works properly', async () => {
  const { chartingButton } = selectors
  await page.goto(multipleDataLayers)
  const isChartingEnabled = await page.$('#chart-toggle-button')
  if (isChartingEnabled) {
    await page.locator('#chart-toggle-button').click()
    await expect(chartingButton).toHaveText('Exit Charting')
    await page.locator('#chart-toggle-button').click()
    await expect(chartingButton).toHaveText('Start Charting')
  }
})

test('Select an Area of Interest works appropriately', async () => {
  await page.goto(multipleDataLayers)
  const isChartingEnabled = await page.$('#chart-toggle-button')
  if (isChartingEnabled) {
    await page.locator('#chart-toggle-button').click()
    const aoiIcon = page.locator('#wv-charting-mode-container > div.charting-aoi-container > h3')
    await expect(aoiIcon).toHaveText('Select Area of Interest')
    await page.locator('#wv-charting-mode-container > div.charting-aoi-container > svg').click()
    await page.mouse.click(300, 300)
    await page.mouse.click(400, 400)
    await expect(aoiIcon).toHaveText('Area of Interest Selected')
  }
})

test('Confirm defaults for time span selection', async () => {
  const { chartingDateSingleButton, chartingDateRangeButton } = selectors
  await page.goto(multipleDataLayers)
  const isChartingEnabled = await page.$('#chart-toggle-button')
  if (isChartingEnabled) {
    await page.locator('#chart-toggle-button').click()
    await expect(chartingDateSingleButton).not.toHaveClass(/btn-active/)
    await expect(chartingDateRangeButton).toHaveClass(/btn-active/)
    await page.locator('#charting-date-single-button').click()
    await expect(chartingDateSingleButton).toHaveClass(/btn-active/)
    await expect(chartingDateRangeButton).not.toHaveClass(/btn-active/)
  }
})

test('Calendar icon opens datepicker modal', async () => {
  await page.goto(multipleDataLayers)
  const isChartingEnabled = await page.$('#chart-toggle-button')
  if (isChartingEnabled) {
    await page.locator('#chart-toggle-button').click()
    await page.locator('#charting-calendar-container > svg').click()
    const chartingDateModal = page.locator('#charting_date_modal > div > div > div.modal-header > h5')
    await expect(chartingDateModal).toHaveText('Charting Mode Date Selection')
  }
})

test('Info modal opens on mode start & on icon click', async () => {
  await page.goto(multipleDataLayers)
  const isChartingEnabled = await page.$('#chart-toggle-button')
  if (isChartingEnabled) {
    await page.locator('#chart-toggle-button').click()
    const infoModal = page.locator('#charting_info_modal > div > div > div.modal-header > h5')
    await expect(infoModal).toHaveText('Charting Tool')
    await page.locator('#charting_info_modal > div > div > div.modal-header > button').click()
    await expect(infoModal).toHaveCount(0)
    await page.locator('#charting-info-container > svg').click()
    await expect(infoModal).toHaveText('Charting Tool')
  }
})

test('User can toggle active layer', async () => {
  await page.goto(multipleDataLayers)
  const isChartingEnabled = await page.$('#chart-toggle-button')
  if (isChartingEnabled) {
    await page.locator('#chart-toggle-button').click()
    const layerOneAnchor = page.locator('#activate-MODIS_Terra_Aerosol')
    const layerTwoAnchor = page.locator('#activate-MODIS_Terra_Brightness_Temp_Band31_Day')
    await expect(layerOneAnchor).toHaveClass('layer-visible visibility active-chart')
    await expect(layerTwoAnchor).toHaveClass('layer-visible visibility')
    await page.locator('#activate-MODIS_Terra_Brightness_Temp_Band31_Day > svg').click()
    await expect(layerOneAnchor).toHaveClass('layer-visible visibility')
    await expect(layerTwoAnchor).toHaveClass('layer-visible visibility active-chart')
  }
})
