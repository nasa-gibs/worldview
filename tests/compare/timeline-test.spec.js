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

test('Verify that A|B draggers are visible', async () => {
  await page.goto(swipeAndAIsActive)
  const draggerA = page.locator('.timeline-dragger.draggerA')
  const draggerB = page.locator('.timeline-dragger.draggerB')
  await expect(draggerA).toBeVisible()
  await expect(draggerB).toBeVisible()
})

test('Dragging active dragger updates date', async () => {
  const draggerA = page.locator('.timeline-dragger.draggerA')
  const dateSelectorDayInput = page.locator('#date-selector-main .input-wrapper-day input')
  const dateSelectorMonthInput = page.locator('#date-selector-main .input-wrapper-month input')
  // this only represents aug25 at the exact screen size of the testing window
  const aug25 = page.locator('rect.axis-grid-rect[width="12"][height="65"][x="1176"][fill="transparent"]')
  await expect(dateSelectorDayInput).toHaveValue('17')
  await expect(dateSelectorMonthInput).toHaveValue('AUG')
  await draggerA.dragTo(aug25)
  const day = dateSelectorDayInput.innerText()
  const month = dateSelectorMonthInput.innerText()
  const result = month + day
  expect(result).not.toEqual('AUG17')
})

test('Clicking inactive dragger updates active state', async () => {
  const { aTab } = selectors
  await expect(aTab).toHaveClass(/active/)
  const draggerB = page.locator('.timeline-dragger.draggerB')
  const dateSelectorDayInput = page.locator('#date-selector-main .input-wrapper-day input')
  await draggerB.click()
  await expect(dateSelectorDayInput).toHaveValue('16')
})

test('Dragging B dragger updates date in label', async () => {
  const { bTab } = selectors
  const draggerB = page.locator('.timeline-dragger.draggerB')
  await expect(bTab).toContainText('2018 AUG 16')
  // this only represents aug2 at the exact screen size of the testing window
  const aug2 = page.locator('rect.axis-grid-rect[width="12"][height="65"][x="900"][fill="transparent"]')
  await draggerB.dragTo(aug2)
  const result = bTab.innerText()
  expect(result).not.toEqual('B: 2018 AUG 16')
})

test('Deactivate A|B is no longer active', async () => {
  const { compareButton } = selectors
  const draggerA = page.locator('.timeline-dragger.draggerA')
  const draggerB = page.locator('.timeline-dragger.draggerB')
  await compareButton.click()
  await expect(compareButton).toContainText('Start Comparison')
  await expect(draggerA).not.toBeVisible()
  await expect(draggerB).toBeVisible()
})
