const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { knownDate } = require('../../test-utils/global-variables/querystrings')

let page
let selectors

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

test('Clicking the animation widget button opens the widget', async () => {
  const { mobileAnimateButton } = selectors
  await page.goto(knownDate)
  await mobileAnimateButton.click()
  const customIntervalInput = page.locator('.custom-interval-delta-input')
  await expect(customIntervalInput).toHaveValue('1')
  const dropdownToggle = page.locator('.dropdown-toggle')
  await expect(dropdownToggle).toHaveText('DAY')
})

test('Minimizing mobile animation widget opens collapsed animation widget', async () => {
  const { closeMobileAnimation } = selectors
  await closeMobileAnimation.click()
  const collapsedPortraitView = page.locator('#collapsed-animate-widget-phone-portrait')
  await expect(collapsedPortraitView).toBeVisible()
})

test('Playing the animation changes the date of the mobile date picker', async () => {
  const { mobileDatePickerSpanText } = selectors
  await page.locator('#collapsed-animate-widget-phone-portrait').click()
  // this pause is the minimum amount of time needed to load & play the animation on a throttled connection
  await page.waitForTimeout(10000)
  await expect(mobileDatePickerSpanText).toHaveText('2019 AUG 01')
})

test('Pressing the animation button brings up the mobile animation widget with the same information', async () => {
  const { mobileAnimateButton } = selectors
  await mobileAnimateButton.click()
  const startDateText = page.locator('#mobile-animation-start-date .mobile-date-picker-select-btn span')
  const endDateText = page.locator('#mobile-animation-end-date .mobile-date-picker-select-btn span')
  await expect(startDateText).toHaveText('2019 JUL 22')
  await expect(endDateText).toHaveText('2019 AUG 01')
})
