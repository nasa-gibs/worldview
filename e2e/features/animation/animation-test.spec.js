// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { skipTour, activeAnimationWidget, animationGeostationary } = require('../../test-utils/global-variables/querystrings')

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

test('Clicking the animation widget button opens the widget', async () => {
  const { dragger, animationWidget, animationButton } = selectors
  await page.goto(skipTour)
  await expect(dragger).toBeVisible()
  await expect(animationWidget).not.toBeVisible()
  await animationButton.click()
  await expect(animationWidget).toBeVisible()
})

test('Opening custom interval widget', async () => {
  await page.goto(activeAnimationWidget)
  await page.locator('.wv-animation-widget-header #timeline-interval-btn-container #current-interval').hover()
  const yearInterval = page.locator('.wv-animation-widget-header .timeline-interval .interval-years')
  await expect(yearInterval).toBeVisible()
  await page.locator('.wv-animation-widget-header .timeline-interval #interval-custom-static').click()
  const customIntervalWidget = page.locator('#wv-animation-widget .custom-interval-widget')
  const widgetHeader = page.locator('.wv-animation-widget-header #current-interval')
  const timelineInterval = page.locator('#timeline #current-interval')
  const expectedText = ('1 day')
  await expect(customIntervalWidget).toBeVisible()
  await expect(widgetHeader).toHaveText(expectedText)
  await expect(timelineInterval).toHaveText(expectedText)
})

test('Changing animation time interval', async () => {
  const { animationButton } = selectors
  await page.goto(skipTour)
  await animationButton.click()
  await page.locator('.wv-animation-widget-header #timeline-interval-btn-container #current-interval').hover()
  const yearInterval = page.locator('.wv-animation-widget-header .timeline-interval .interval-years')
  await expect(yearInterval).toBeVisible()
  await yearInterval.click()
  const widgetHeader = page.locator('.wv-animation-widget-header #current-interval')
  const timelineInterval = page.locator('#timeline #current-interval')
  const expectedText = ('1 year')
  await expect(widgetHeader).toHaveText(expectedText)
  await expect(timelineInterval).toHaveText(expectedText)
})

test('Disable playback when max frames exceeded', async () => {
  const { playButton, yearStartInput } = selectors
  await page.goto(animationGeostationary)
  const animateYearDown = page.locator('.wv-date-range-selector > div > div > div:nth-child(3) > svg > .downarrow').first()
  const animateYearUp = page.locator('.wv-date-range-selector > div > div > div > svg > .uparrow').first()
  await animateYearDown.click()
  await expect(playButton).toHaveClass(/disabled/)
  // Playback re-enabled when frames within the max
  await animateYearUp.click()
  await expect(playButton).not.toHaveClass(/disabled/)
  // App should not freeze when dates roll over
  await animateYearUp.click()
  await expect(yearStartInput).toHaveValue('1948')
  await expect(playButton).toHaveClass(/disabled/)
})
