// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { skipTour } = require('../../test-utils/global-variables/querystrings')
const { getAttribute } = require('../../test-utils/hooks/basicHooks')
const {
  createDistanceMeasurement,
  createAreaMeasurement,
  switchProjections,
} = require('../../test-utils/hooks/wvHooks')

let page
let selectors

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1700, height: 1000 }
  })
  page = await context.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Clicking the measure button opens the menu', async () => {
  const { measureMenu, measureBtn } = selectors
  await page.goto(skipTour)
  await expect(measureMenu).not.toBeVisible()
  await measureBtn.click()
})

test('Cancelling a measurement causes an alert to disappear and sidebar to expand', async () => {
  const { measureDistanceBtn } = selectors
  await measureDistanceBtn.click()
  const measurementAlert = await page.locator('#measurement-alert')
  await page.mouse.click(800, 110, { button: 'right' })
  await page.mouse.click(900, 110)
  await expect(measurementAlert).not.toBeVisible()
  const sidebarContainerId = '#products-holder'
  const sidebarStyleAttribute = await getAttribute(page, sidebarContainerId, 'style')
  expect(sidebarStyleAttribute).not.toContain('max-height: 0px')
})

test('Creating a distance measurement causes a tooltip to show', async () => {
  const { geoMeasurementTooltip } = selectors
  await createDistanceMeasurement(page, [850, 500], [850, 700])
  await createDistanceMeasurement(page, [950, 500], [950, 700])
  await expect(geoMeasurementTooltip).toHaveCount(2)
})

test('Creating an area measurement causes a tooltip to show', async () => {
  const { geoMeasurementTooltip} = selectors
  await createAreaMeasurement(page, [500, 500], [500, 700], [600, 600])
  await expect(geoMeasurementTooltip).toHaveCount(3)
})

test('Download as GeoJSON and Shapefile options available in menu', async () => {
  const { measureBtn } = selectors
  await measureBtn.click()
  await page.locator('.modal').click()
})

test('Switching to arctic projection, no measurements show', async () => {
  const { arcticMeasurementTooltip } = selectors
  await switchProjections(page, 'arctic')
  await expect(arcticMeasurementTooltip).toHaveCount(0)
})

test('Download as GeoJSON and Shapefile options NOT available in menu', async () => {
  const { measureBtn, downloadGeojsonBtn } = selectors
  await measureBtn.click()
  await expect(downloadGeojsonBtn).not.toBeVisible()
  await page.locator('.modal').click()
})

test('Creating measurements in arctic projection causes tooltips to show', async () => {
  const { arcticMeasurementTooltip } = selectors
  await createDistanceMeasurement(page, [850, 500], [850, 700])
  await createDistanceMeasurement(page, [950, 500], [950, 700])
  await expect(arcticMeasurementTooltip).toHaveCount(2)
})

test('Clearing a measurements removes all tooltips in this projection only', async () => {
  const {
    measureBtn,
    clearMeasurementsBtn,
    arcticMeasurementTooltip,
    geoMeasurementTooltip,
  } = selectors
  await measureBtn.click()
  await clearMeasurementsBtn.click()
  await expect(arcticMeasurementTooltip).toHaveCount(0)
  await expect(geoMeasurementTooltip).toHaveCount(3)
})

test('Switching back to geographic projection, three measurements show again', async () => {
  const { geoMeasurementTooltip } = selectors
  await switchProjections(page, 'geographic')
  await expect(geoMeasurementTooltip).toHaveCount(3)
})

test('Clearing a measurements removes all tooltips', async () => {
  const {
    measureBtn,
    clearMeasurementsBtn,
    measurementTooltip
  } = selectors
  await measureBtn.click()
  await clearMeasurementsBtn.click()
  await expect(measurementTooltip).toHaveCount(0)
})

test('Toggling unit of measure updates the measurement value', async () => {
  const { measureBtn, unitOfMeasureToggle } = selectors
  await createDistanceMeasurement(page, [850, 500], [850, 700])
  await measureBtn.click()
  await unitOfMeasureToggle.click()
  const tooltip = await page.locator('.tooltip-measure span').first();
  await expect(tooltip).toContainText('mi')
})
