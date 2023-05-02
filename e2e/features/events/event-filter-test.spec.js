// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { fixedAppNow, wildfiresWithDates, backwardsCompatibleEventUrl, extentsUrl } = require('../../test-utils/global-variables/querystrings')
const { switchProjections, clickAndWait } = require('../../test-utils/hooks/wvHooks')

let page
let selectors

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

const assertDateInputValues = async (start, end) => {
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

test('Default filtering includes last 120 days and all categories', async () => {
  const { eventsTab, filterIcons, filterDates } = selectors
  await page.goto(fixedAppNow)
  await eventsTab.click()
  await expect(filterIcons).toHaveCount(8)
  await expect(filterDates).toContainText('2011 SEP 02 - 2011 DEC 31')
})

test('Filter modal inputs are correct', async () => {
  const {
    filterButton,
    dustSwitch,
    manmadeSwitch,
    seaLakeIceSwitch,
    severeStormsSwitch,
    snowSwitch,
    volcanoesSwitch,
    watercolorSwitch,
    wildfiresSwitch,
    mapExtentFilterCheckbox
  } = selectors
  await filterButton.click()
  await assertDateInputValues('2011-SEP-02', '2011-DEC-31')
  await expect(dustSwitch).toBeChecked()
  await expect(manmadeSwitch).toBeChecked()
  await expect(seaLakeIceSwitch).toBeChecked()
  await expect(severeStormsSwitch).toBeChecked()
  await expect(snowSwitch).toBeChecked()
  await expect(volcanoesSwitch).toBeChecked()
  await expect(watercolorSwitch).toBeChecked()
  await expect(wildfiresSwitch).toBeChecked()
  await expect(mapExtentFilterCheckbox).not.toBeChecked()
})

test('URL params for categories, dates, and extent filtering are present', async () => {
  const currentUrl = await page.url()
  expect(currentUrl).toContain('e=true')
  expect(currentUrl).toContain('efc=dustHaze,manmade,seaLakeIce,severeStorms,snow,volcanoes,waterColor,wildfires')
  expect(currentUrl).toContain('efd=2011-09-02,2011-12-31')
  expect(currentUrl).toContain('efs=true')
})

test('Loading from permalink sets all criteria properly', async () => {
  const {
    filterButton,
    dustSwitch,
    manmadeSwitch,
    seaLakeIceSwitch,
    severeStormsSwitch,
    snowSwitch,
    volcanoesSwitch,
    watercolorSwitch,
    wildfiresSwitch,
    mapExtentFilterCheckbox,
    filterIcons,
    wildfiresIcon,
    filterDates
  } = selectors
  await page.goto(wildfiresWithDates)

  const currentUrl = await page.url()

  expect(currentUrl).toContain('e=true')
  expect(currentUrl).toContain('efc=wildfires')
  expect(currentUrl).toContain('efd=2020-01-16,2020-06-16')
  expect(currentUrl).toContain('efs=false')

  // Check filter criteria summary in sidebar
  await expect(filterIcons).toHaveCount(1)
  await expect(wildfiresIcon).toBeVisible()
  await expect(filterDates).toHaveText('2020 JAN 16 - 2020 JUN 16')
  await filterButton.click()
  await assertDateInputValues('2020-JAN-16', '2020-JUN-16')
  await expect(dustSwitch).not.toBeChecked()
  await expect(manmadeSwitch).not.toBeChecked()
  await expect(seaLakeIceSwitch).not.toBeChecked()
  await expect(severeStormsSwitch).not.toBeChecked()
  await expect(snowSwitch).not.toBeChecked()
  await expect(volcanoesSwitch).not.toBeChecked()
  await expect(watercolorSwitch).not.toBeChecked()
  await expect(wildfiresSwitch).toBeChecked()
  await expect(mapExtentFilterCheckbox).toBeChecked()
})

test('Changing criteria in modal DOES NOT update summary of criteria in sidebar on CANCEL', async () => {
  const {
    startInputYear,
    startInputMonth,
    startInputDay,
    endInputYear,
    endInputMonth,
    endInputDay,
    filterButton,
    filterModalCancel,
    filterDates,
    filterIcons,
    wildfiresIcon
  } = selectors
  await page.goto(wildfiresWithDates)
  await filterButton.click()
  await startInputYear.fill('2000')
  await startInputMonth.fill('APR')
  await startInputDay.fill('19')
  await endInputYear.fill('2001')
  await endInputMonth.fill('NOV')
  await endInputDay.fill('11')
  await clickAndWait(page, '#wildfires-switch + .react-switch-label')
  await clickAndWait(page, '#dustHaze-switch + .react-switch-label')
  await clickAndWait(page, '#volcanoes-switch + .react-switch-label')
  await filterModalCancel.click()
  await expect(filterDates).toContainText('2020 JAN 16 - 2020 JUN 16')
  await expect(filterIcons).toHaveCount(1)
  await expect(wildfiresIcon).toBeVisible()
})

test('Opening modal after cancelling changed values shows previous unchanged values', async () => {
  const {
    filterButton,
    dustSwitch,
    manmadeSwitch,
    seaLakeIceSwitch,
    severeStormsSwitch,
    snowSwitch,
    volcanoesSwitch,
    watercolorSwitch,
    wildfiresSwitch,
    mapExtentFilterCheckbox
  } = selectors
  await filterButton.click()
  await assertDateInputValues('2020-JAN-16', '2020-JUN-16')
  await expect(dustSwitch).not.toBeChecked()
  await expect(manmadeSwitch).not.toBeChecked()
  await expect(seaLakeIceSwitch).not.toBeChecked()
  await expect(severeStormsSwitch).not.toBeChecked()
  await expect(snowSwitch).not.toBeChecked()
  await expect(volcanoesSwitch).not.toBeChecked()
  await expect(watercolorSwitch).not.toBeChecked()
  await expect(wildfiresSwitch).toBeChecked()
  await expect(mapExtentFilterCheckbox).toBeChecked()
})

test('Changing criteria in modal DOES update summary of criteria in sidebar on APPLY', async () => {
  const {
    startInputYear,
    startInputMonth,
    startInputDay,
    endInputYear,
    endInputMonth,
    endInputDay,
    filterModalApply,
    filterDates,
    filterIcons,
    wildfiresIcon,
    dustHazeIcon,
    volcanoesIcon
  } = selectors
  await startInputYear.fill('2000')
  await startInputMonth.fill('APR')
  await startInputDay.fill('19')
  await endInputYear.fill('2001')
  await endInputMonth.fill('NOV')
  await endInputDay.fill('11')
  await clickAndWait(page, '#wildfires-switch + .react-switch-label')
  await clickAndWait(page, '#dustHaze-switch + .react-switch-label')
  await clickAndWait(page, '#volcanoes-switch + .react-switch-label')
  await filterModalApply.click()
  await expect(filterDates).toContainText('2000 APR 19 - 2001 NOV 11')
  await expect(filterIcons).toHaveCount(2)
  await expect(dustHazeIcon).toBeVisible()
  await expect(volcanoesIcon).toBeVisible()
  await expect(wildfiresIcon).not.toBeVisible()
})

test('Event Selected, No Filter Params: Shows only day of event, all categories, checkbox unchecked', async () => {
  const { filterDates, filterButton, filterIcons, mapExtentFilterCheckbox } = selectors
  await page.goto(backwardsCompatibleEventUrl)
  await expect(filterDates).toContainText('2005 DEC 31 - 2005 DEC 31')
  await filterButton.click()
  await assertDateInputValues('2005-DEC-31', '2005-DEC-31')
  await expect(filterIcons).toHaveCount(8)
  await expect(mapExtentFilterCheckbox).not.toBeChecked()
  await page.locator('.modal-close-btn').click()
})

test('No extent search checkbox in polar projections', async () => {
  const { filterButton, mapExtentFilterCheckbox } = selectors
  await page.goto(extentsUrl)
  await filterButton.click()
  await expect(mapExtentFilterCheckbox).toBeVisible()
  await expect(mapExtentFilterCheckbox).toBeChecked()
  await page.locator('.modal-close-btn').click()
  await switchProjections(page, 'arctic')
  await filterButton.click()
  await expect(mapExtentFilterCheckbox).not.toBeVisible()
  await page.locator('.modal-close-btn').click()
  await switchProjections(page, 'geographic')
  await page.waitForTimeout(5000)
  await filterButton.click()
  await expect(mapExtentFilterCheckbox).toBeChecked()
  await page.locator('.modal-close-btn').click()
  await switchProjections(page, 'antarctic')
  await filterButton.click()
  await expect(mapExtentFilterCheckbox).not.toBeVisible()
  await page.locator('.modal-close-btn').click()
})
