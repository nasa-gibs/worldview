// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const {
  skipTour,
  subdailyLayerIntervalTimescale,
  knownDate
} = require('../../test-utils/global-variables/querystrings')

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

test('Dragger is visible', async () => {
  const { dragger } = selectors
  await page.goto(skipTour)
  await expect(dragger).toBeVisible()
})

test('Timeline is expanded by default and closes/reopen on clicking timeline chevrons', async () => {
  const timelineFooter = await page.locator('#timeline-footer')
  await expect(timelineFooter).toBeVisible()
  await page.locator('#timeline-hide').click()
  await expect(timelineFooter).not.toBeVisible()
  await page.locator('#timeline-hide').click()
  await expect(timelineFooter).toBeVisible()
})

test('verify default MMM YYYY format is displayed on axis', async () => {
  const axisGridDay = await page.locator('.axis-grid-text-day').first()
  const axisGridYear = await page.locator('.axis-grid-text-year').first()
  await expect(axisGridDay).toBeVisible()
  await expect(axisGridYear).toBeVisible()
})

test('Interval defaults to 1 DAY', async () => {
  const currentInteval = await page.locator('#current-interval')
  await expect(currentInteval).toContainText('1 day')
})

test('Change to month zoom level and axis changes', async () => {
  await page.locator('.zoom-level-change div.date-arrows.date-arrow-up').click()
  const axisGridDay = await page.locator('.axis-grid-text-day').first()
  const axisGridMonth = await page.locator('.axis-grid-text-month').first()
  const currentZoom = await page.locator('#current-zoom')
  await expect(axisGridDay).not.toBeVisible()
  await expect(axisGridMonth).toBeVisible()
  await expect(currentZoom).toContainText('month')
})

test('Change to year zoom level and axis changes', async () => {
  await page.locator('.zoom-level-change div.date-arrows.date-arrow-up').click()
  await page.locator('.zoom-level-change div.date-arrows.date-arrow-up').click()
  const axisGridDay = await page.locator('.axis-grid-text-day').first()
  const axisGridYear = await page.locator('.axis-grid-text-year').first()
  const currentZoom = await page.locator('#current-zoom')
  await expect(axisGridDay).not.toBeVisible()
  await expect(axisGridYear).toBeVisible()
  await expect(currentZoom).toContainText('year')
})

test('Interval state of HOUR restored from permalink', async () => {
  await page.goto(subdailyLayerIntervalTimescale)
  const currentInteval = await page.locator('#current-interval')
  await page.locator('#timeline-interval-btn-container').hover()
  await expect(currentInteval).toContainText('1 hour')
})

test('Interval subdaily default year, month, day, hour, minute, and custom available', async () => {
  const yearlyInterval = await page.locator('#interval-years')
  const monthlyInterval = await page.locator('#interval-months')
  const dailyInterval = await page.locator('#interval-days')
  const hourlyInterval = await page.locator('#interval-hours')
  const minuteInterval = await page.locator('#interval-minutes')
  const staticInterval = await page.locator('#interval-custom-static')
  await expect(yearlyInterval).toBeVisible()
  await expect(monthlyInterval).toBeVisible()
  await expect(dailyInterval).toBeVisible()
  await expect(hourlyInterval).toBeVisible()
  await expect(minuteInterval).toBeVisible()
  await expect(staticInterval).toBeVisible()
})

test('Custom interval widget opens on selecting custom', async () => {
  const customIntervalWidget = await page.locator('.custom-interval-widget')
  await page.locator('#interval-custom-static').click()
  await expect(customIntervalWidget).toBeVisible()
})

test('Select custom interval changes current interval and changes date by current interval', async () => {
  const { dateSelectorDayInput } = selectors
  const customInterval = await page.locator('#current-interval')
  await page.goto(knownDate)
  await expect(dateSelectorDayInput).toHaveValue('22')
  await page.locator('#timeline-interval-btn-container').hover()
  await page.locator('#interval-custom-static').click()
  await page.locator('.custom-interval-delta-input').fill('2')
  await page.keyboard.press('Enter')
  await page.locator('#left-arrow-group').hover()
  await page.locator('#left-arrow-group').click()
  await expect(customInterval).toContainText('2 day')
  await expect(dateSelectorDayInput).toHaveValue('20')
})

test('Timescale zoom level defaults to DAY', async () => {
  await page.goto(skipTour)
  const currentZoom = await page.locator('#current-zoom')
  await expect(currentZoom).toContainText('day')
})

test('Timescale zoom subdaily default year, month, day, hour, minute, and custom intervals', async () => {
  const zoomYears = await page.locator('#zoom-years')
  const zoomMonths = await page.locator('#zoom-months')
  const zoomDays = await page.locator('#zoom-days')
  const zoomHours = await page.locator('#zoom-hours')
  const zoomMinutes = await page.locator('#zoom-minutes')
  await page.goto(subdailyLayerIntervalTimescale)
  await page.locator('#current-zoom').hover()
  await expect(zoomYears).toBeVisible()
  await expect(zoomMonths).toBeVisible()
  await expect(zoomDays).toBeVisible()
  await expect(zoomHours).toBeVisible()
  await expect(zoomMinutes).toBeVisible()
})

test('Timescale zoom HOUR restored from permalink', async () => {
  const currentZoom = await page.locator('#current-zoom')
  await expect(currentZoom).toContainText('hour')
})

test('Date tooltip date present load', async () => {
  const queryString = 'http://localhost:3000/?t=2019-02-22'
  await page.goto(queryString)
  const dateTooltip = await page.locator('.date-tooltip')
  await expect(dateTooltip).toContainText('2019 FEB 22 (DOY 053)')
})

test('Date subdaily tooltip date present on load', async () => {
  await page.goto(subdailyLayerIntervalTimescale)
  const dateTooltip = await page.locator('.date-tooltip')
  await expect(dateTooltip).toContainText('2019 OCT 04 09:46Z (DOY 277)')
})
