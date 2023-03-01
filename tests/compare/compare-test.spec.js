// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { swipeAndAIsActive } = require('../../test-utils/global-variables/querystrings')

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

test('Animation is disabled when compare mode active', async () => {
  const {
    animationButtonCase,
    swipeDragger,
    ModisTrueColorLayerA,
    ModisTrueColorLayerB,
    toggleButton,
    collapsedToggleButton,
    tooltipSelector,
  } = selectors
  await page.goto(swipeAndAIsActive)
  await expect(animationButtonCase).toHaveClass(/wv-disabled-button/)
  const disableMessage = 'Animation feature is deactivated when Compare feature is active'
  await expect(animationButtonCase).toHaveAttribute('aria-label', disableMessage)
  await animationButtonCase.hover()
  const tooltip = page.locator('.tooltip-inner')
  await expect(tooltip).toHaveText(disableMessage)

})