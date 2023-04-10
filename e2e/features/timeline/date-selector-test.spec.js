// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { subdailyLayerIntervalTimescale, knownDate } = require('../../test-utils/global-variables/querystrings')

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

test('Verify subdaily default year, month, day, hour, minute date selector inputs', async () => {
  const {
    dateSelectorMinuteInput,
    dateSelectorHourInput,
    dateSelectorDayInput,
    dateSelectorMonthInput,
    dateSelectorYearInput
  } = selectors
  await page.goto(subdailyLayerIntervalTimescale)
  await expect(dateSelectorMinuteInput).toBeVisible()
  await expect(dateSelectorHourInput).toBeVisible()
  await expect(dateSelectorDayInput).toBeVisible()
  await expect(dateSelectorMonthInput).toBeVisible()
  await expect(dateSelectorYearInput).toBeVisible()
})

test('Change date using left/right arrows', async () => {
  const { dateSelectorDayInput } = selectors
  await page.goto(knownDate)
  await expect(dateSelectorDayInput).toHaveValue('22')
  await page.locator('#left-arrow-group').click()
  await expect(dateSelectorDayInput).toHaveValue('21')
  await page.locator('#right-arrow-group').click()
  await expect(dateSelectorDayInput).toHaveValue('22')
})

test('Left timeline arrow will not be disabled by default', async () => {
  const queryString = 'http://localhost:3000/'
  await page.goto(queryString)
  await page.getByRole('button', { name: '×' }).click()
  const leftArrow = await page.locator('#left-arrow-group')
  await expect(leftArrow).not.toHaveClass(/button-disabled/)
})

test('Right timeline arrow will be disabled by default', async () => {
  const queryString = 'http://localhost:3000/'
  await page.goto(queryString)
  await page.getByRole('button', { name: '×' }).click()
  const rightArrow = await page.locator('#right-arrow-group')
  await expect(rightArrow).toHaveClass(/button-disabled/)
})

test('Now button will be disabled by default', async () => {
  const queryString = 'http://localhost:3000/'
  await page.goto(queryString)
  await page.getByRole('button', { name: '×' }).click()
  const nowButton = page.locator('#now-button-group')
  await expect(nowButton).toHaveClass(/button-disabled/)
})

test('Right timeline arrow will not be disabled', async () => {
  await page.goto(knownDate)
  const rightArrow = await page.locator('#right-arrow-group')
  await expect(rightArrow).not.toHaveClass(/button-disabled/)
})

test('Now button will not be disabled if date is not on now', async () => {
  await page.goto(knownDate)
  const nowButton = await page.locator('#now-button-group')
  await expect(nowButton).not.toHaveClass(/button-disabled/)
})

test('Verify date selector is populated with date YYYY-MON-DD', async () => {
  const {
    dateSelectorDayInput,
    dateSelectorMonthInput,
    dateSelectorYearInput
  } = selectors
  const queryString = 'http://localhost:3000/?t=2019-02-22'
  await page.goto(queryString)
  await expect(dateSelectorDayInput).toHaveValue('22')
  await expect(dateSelectorMonthInput).toHaveValue('FEB')
  await expect(dateSelectorYearInput).toHaveValue('2019')
})

test('Verify subdaily date selector is populated with date YYYY-MON-DD-HH-MM', async () => {
  const {
    dateSelectorDayInput,
    dateSelectorMonthInput,
    dateSelectorYearInput,
    dateSelectorHourInput,
    dateSelectorMinuteInput
  } = selectors
  await page.goto(subdailyLayerIntervalTimescale)
  await expect(dateSelectorMinuteInput).toHaveValue('46')
  await expect(dateSelectorHourInput).toHaveValue('09')
  await expect(dateSelectorDayInput).toHaveValue('04')
  await expect(dateSelectorMonthInput).toHaveValue('OCT')
  await expect(dateSelectorYearInput).toHaveValue('2019')
})

test('Allow invalid day values in date selector', async () => {
  const { dateSelectorDayInput } = selectors
  const queryString = 'http://localhost:3000/?t=2019-02-22'
  await page.goto(queryString)
  await dateSelectorDayInput.fill('31')
  await page.keyboard.press('Enter')
  await expect(dateSelectorDayInput).toHaveClass(/invalid-input/)
})

test('Allow invalid year to valid year values in date selector', async () => {
  const {
    dateSelectorDayInput,
    dateSelectorMonthInput,
    dateSelectorYearInput
  } = selectors
  const queryString = 'http://localhost:3000/?t=2019-02-22'
  await page.goto(queryString)
  await dateSelectorYearInput.fill('2020')
  await dateSelectorMonthInput.fill('MAR')
  await dateSelectorDayInput.fill('31')
  await dateSelectorYearInput.fill('2019')
  await expect(dateSelectorDayInput).not.toHaveClass(/invalid-input/)
  await expect(dateSelectorMonthInput).not.toHaveClass(/invalid-input/)
  await expect(dateSelectorYearInput).not.toHaveClass(/invalid-input/)
})

test('Verify invalid days are rolled over', async () => {
  const {
    dateSelectorDayInput,
    dateSelectorMonthInput,
    dateSelectorYearInput
  } = selectors
  const queryString = 'http://localhost:3000/?t=2013-02-29'
  await page.goto(queryString)
  await expect(dateSelectorDayInput).toHaveValue('01')
  await expect(dateSelectorMonthInput).toHaveValue('MAR')
  await expect(dateSelectorYearInput).toHaveValue('2013')
})

test('Date selector up arrow rolls over from Feb 28 to 1 (non leap year) and the inverse', async () => {
  const {
    dayUp,
    dayDown,
    dateSelectorDayInput,
    dateSelectorMonthInput,
    dateSelectorYearInput
  } = selectors
  const queryString = 'http://localhost:3000/?t=2013-02-28'
  await page.goto(queryString)
  await dayUp.click()
  await expect(dateSelectorDayInput).toHaveValue('01')
  await expect(dateSelectorMonthInput).toHaveValue('FEB')
  await expect(dateSelectorYearInput).toHaveValue('2013')
  await dayDown.click()
  await expect(dateSelectorDayInput).toHaveValue('28')
  await expect(dateSelectorMonthInput).toHaveValue('FEB')
  await expect(dateSelectorYearInput).toHaveValue('2013')
})

test('Added future layer and right timeline arrow is not disabled', async () => {
  const queryString = 'http://localhost:3000/?mockFutureLayer=VIIRS_SNPP_CorrectedReflectance_TrueColor,3D'
  await page.goto(queryString)
  const rightArrow = await page.locator('#right-arrow-group')
  await expect(rightArrow).not.toHaveClass(/button-disabled/)
  await rightArrow.click()
  await expect(rightArrow).not.toHaveClass(/button-disabled/)
})
