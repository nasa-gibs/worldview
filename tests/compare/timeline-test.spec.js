// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { swipeAndAIsActive } = require('../../test-utils/global-variables/querystrings')
const { timelineDrag, dateSelectorMonthDay } = require('../../test-utils/hooks/wvHooks')

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
  const { draggerA, draggerB } = selectors
  await page.goto(swipeAndAIsActive)
  await expect(draggerA).toBeVisible()
  await expect(draggerB).toBeVisible()
})

test('Dragging active dragger updates date', async () => {
  const { dateSelectorDayInput, dateSelectorMonthInput } = selectors
  await expect(dateSelectorDayInput).toHaveValue('17')
  await expect(dateSelectorMonthInput).toHaveValue('AUG')
  await timelineDrag(page, 'a', '1176')
  const result = dateSelectorMonthDay(page)
  expect(result).not.toEqual('AUG17')
})

test('Clicking inactive dragger updates active state', async () => {
  const { aTab, draggerB, dateSelectorDayInput } = selectors
  await expect(aTab).toHaveClass(/active/)
  await draggerB.click()
  await expect(dateSelectorDayInput).toHaveValue('16')
})

test('Dragging B dragger updates date in label', async () => {
  const { bTab } = selectors
  await expect(bTab).toContainText('2018 AUG 16')
  await timelineDrag(page, 'b', '900')
  const result = bTab.innerText()
  expect(result).not.toEqual('B: 2018 AUG 16')
})

test('Deactivate A|B is no longer active', async () => {
  const { compareButton, draggerA, draggerB } = selectors
  await compareButton.click()
  await expect(compareButton).toContainText('Start Comparison')
  await expect(draggerA).not.toBeVisible()
  await expect(draggerB).toBeVisible()
})
