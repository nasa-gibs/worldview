const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { swipeAndAIsActive, spyAndBIsActive, opacityAndBIsActive } = require('../../test-utils/global-variables/querystrings')

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

test('Mobile comparison A|B toggle buttons are visible and only A is selected by default', async () => {
  await page.goto(swipeAndAIsActive)
  const aMobileCompareButton = page.locator('.comparison-mobile-select-toggle > div:nth-child(1)')
  const bMobileCompareButton = page.locator('.comparison-mobile-select-toggle > div:nth-child(2)')
  await expect(aMobileCompareButton).toHaveClass(/compare-btn-selected/)
  await expect(bMobileCompareButton).not.toHaveClass(/compare-btn-selected/)
})

// toggle select B change compare mode date to B
test('Toggling to B compare side changes mobile date picker date', async () => {
  const { mobileDatePickerSelectButton } = selectors
  const bMobileCompareButton = page.locator('.comparison-mobile-select-toggle > div:nth-child(2)')
  // confirm initial A mobile date picker date
  await expect(mobileDatePickerSelectButton).toHaveText('2018 AUG 17')
  // click B compare toggle button and confirm B mobile date picker date
  await bMobileCompareButton.click()
  await expect(mobileDatePickerSelectButton).toHaveText('2018 AUG 16')
})

test('Expand mobile layer list and confirm comparison mode button is present and toggles compare mode', async () => {
  const {
    collapsedLayerButton,
    compareButton,
    aTab,
    bTab,
    compareButtonText
  } = selectors
  await collapsedLayerButton.click()
  await expect(compareButton).toBeVisible()
  await expect(aTab).toBeVisible()
  await expect(bTab).toBeVisible()
  await expect(compareButtonText).toHaveText('Exit Comparison Mode')
  await compareButton.click()
  await expect(aTab).not.toBeVisible()
  await expect(bTab).not.toBeVisible()
  await expect(compareButton).toBeVisible()
  await expect(compareButtonText).toHaveText('Start Comparison Mode')
})

// B compare button toggle is selected on B permalink load and A is not selected
test('B compare button toggle is only selected on B permalink load', async () => {
  await page.goto(spyAndBIsActive)
  const aMobileCompareButton = page.locator('.comparison-mobile-select-toggle > div:nth-child(1)')
  const bMobileCompareButton = page.locator('.comparison-mobile-select-toggle > div:nth-child(2)')
  await expect(aMobileCompareButton).not.toHaveClass(/compare-btn-selected/)
  await expect(bMobileCompareButton).toHaveClass(/compare-btn-selected/)
})

// load comparison SPY mode and verify that it reverts to SWIPE mode
test('Mobile SPY mode reverts to SWIPE mode', async () => {
  const { swipeDragger } = selectors
  await page.goto(spyAndBIsActive)
  await expect(swipeDragger).toBeVisible()
})

// load comparison OPACITY mode and verify that it reverts to SWIPE mode
test('Mobile OPACITY mode reverts to SWIPE mode', async () => {
  const { swipeDragger } = selectors
  await page.goto(opacityAndBIsActive)
  await expect(swipeDragger).toBeVisible()
})
