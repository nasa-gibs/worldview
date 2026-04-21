// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { backwardsCompatibleEventUrl, extentsUrl } = require('../../test-utils/global-variables/querystrings')
const { switchProjections, closeModal } = require('../../test-utils/hooks/wvHooks')

/** @type {import('@playwright/test').Page} */
let page
/** @type {Record<string, import('@playwright/test').Locator>} */
let selectors
test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

const assertDateInputValues = async (/** @type {string} */ start, /** @type {string} */ end) => {
  const {
    startInputYear,
    startInputMonth,
    startInputDay,
    endInputYear,
    endInputMonth,
    endInputDay
  } = selectors
  const [startYear, startMonth, startDay] = start.split('-')
  const [endYear, endMonth, endDay] = end.split('-')
  expect(startInputYear).toHaveValue(startYear)
  expect(startInputMonth).toHaveValue(startMonth)
  expect(startInputDay).toHaveValue(startDay)
  expect(endInputYear).toHaveValue(endYear)
  expect(endInputMonth).toHaveValue(endMonth)
  expect(endInputDay).toHaveValue(endDay)
}

test.afterAll(async () => {
  await page.close()
})

test('Event Selected, No Filter Params: Shows only day of event, all categories, checkbox unchecked', async () => {
  const {
    filterDates,
    filterButton,
    filterIcons,
    mapExtentFilterCheckbox
  } = selectors
  await page.goto(backwardsCompatibleEventUrl)
  await closeModal(page)
  await expect(filterDates).toContainText('2005 DEC 31 - 2005 DEC 31')
  await filterButton.click()
  await assertDateInputValues('2005-DEC-31', '2005-DEC-31')
  await expect(filterIcons).toHaveCount(9)
  await expect(mapExtentFilterCheckbox).not.toBeChecked()
  await page.locator('.modal-close-btn').click()
})

test('No extent search checkbox in polar projections', async () => {
  const { filterButton, mapExtentFilterCheckbox } = selectors
  await page.goto(extentsUrl)
  await closeModal(page)
  await filterButton.click()
  await expect(mapExtentFilterCheckbox).toBeVisible()
  await expect(mapExtentFilterCheckbox).toBeChecked()
  await page.locator('.modal-close-btn').click()
  await switchProjections(page, 'arctic')
  await filterButton.click()
  await expect(mapExtentFilterCheckbox).not.toBeVisible()
  await page.locator('.modal-close-btn').click()
  await switchProjections(page, 'geographic')
  await filterButton.click()
  await expect(mapExtentFilterCheckbox).toBeChecked()
  await page.locator('.modal-close-btn').click()
  await switchProjections(page, 'antarctic')
  await filterButton.click()
  await expect(mapExtentFilterCheckbox).not.toBeVisible()
  await page.locator('.modal-close-btn').click()
})
