// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { fixedAppNow, wildfiresWithDates, backwardsCompatibleEventUrl, extentsUrl } = require('../../test-utils/global-variables/querystrings')
const { switchProjections, clickAndWait } = require('../../test-utils/hooks/wvHooks')
const moment = require('moment')

let page
let selectors
let dayDisplacement

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
  if (process.env.SOTO === 'true') {
    dayDisplacement = 2
  } else {
    dayDisplacement = 0
  }
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
  const { eventsTab, filterIcons, filterDates, modalCloseButton } = selectors
  await page.goto(fixedAppNow)
  await modalCloseButton.click()
  await eventsTab.click()
  await expect(filterIcons).toHaveCount(8)
  const endDate = moment.utc('2011-DEC-31', 'YYYY-MMM-DD').subtract(0 + dayDisplacement, 'days').format('YYYY MMM DD').toUpperCase()
  const startDate = moment.utc('2011-DEC-31', 'YYYY-MMM-DD').subtract(120 + dayDisplacement, 'days').format('YYYY MMM DD').toUpperCase()
  const expectedText = startDate + ' - ' + endDate
  await expect(filterDates).toContainText(expectedText)
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
  const endDate = moment.utc('2011-DEC-31', 'YYYY-MMM-DD').subtract(0 + dayDisplacement, 'days').format('YYYY-MMM-DD').toUpperCase()
  const startDate = moment.utc('2011-DEC-31', 'YYYY-MMM-DD').subtract(120 + dayDisplacement, 'days').format('YYYY-MMM-DD').toUpperCase()
  await filterButton.click()
  await assertDateInputValues(startDate, endDate)
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
  const endDate = moment.utc('2011-DEC-31', 'YYYY-MMM-DD').subtract(0 + dayDisplacement, 'days').format('YYYY-MM-DD').toUpperCase()
  const startDate = moment.utc('2011-DEC-31', 'YYYY-MMM-DD').subtract(120 + dayDisplacement, 'days').format('YYYY-MM-DD').toUpperCase()
  expect(currentUrl).toContain('e=true')
  expect(currentUrl).toContain('efc=dustHaze,manmade,seaLakeIce,severeStorms,snow,volcanoes,waterColor,wildfires')
  expect(currentUrl).toContain('efd=' + startDate + ',' + endDate)
  expect(currentUrl).toContain('efs=true')
})

test('Loading from permalink sets all criteria properly', async () => {
  const {
    dustSwitch,
    filterButton,
    filterDates,
    filterIcons,
    manmadeSwitch,
    mapExtentFilterCheckbox,
    modalCloseButton,
    seaLakeIceSwitch,
    severeStormsSwitch,
    snowSwitch,
    volcanoesSwitch,
    watercolorSwitch,
    wildfiresSwitch,
    wildfiresIcon
  } = selectors
  await page.goto(wildfiresWithDates)
  await modalCloseButton.click()

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
    endInputDay,
    endInputMonth,
    endInputYear,
    filterButton,
    filterDates,
    filterIcons,
    filterModalCancel,
    modalCloseButton,
    startInputYear,
    startInputMonth,
    startInputDay,
    wildfiresIcon
  } = selectors
  await page.goto(wildfiresWithDates)
  await modalCloseButton.click()
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
  const {
    filterDates,
    filterButton,
    filterIcons,
    mapExtentFilterCheckbox,
    modalCloseButton
  } = selectors
  await page.goto(backwardsCompatibleEventUrl)
  await modalCloseButton.click()
  await expect(filterDates).toContainText('2005 DEC 31 - 2005 DEC 31')
  await filterButton.click()
  await assertDateInputValues('2005-DEC-31', '2005-DEC-31')
  await expect(filterIcons).toHaveCount(8)
  await expect(mapExtentFilterCheckbox).not.toBeChecked()
  await page.locator('.modal-close-btn').click()
})

test('No extent search checkbox in polar projections', async () => {
  if (process.env.SOTO === 'true') {
    test.skip(true, 'Polar change is hidden by something: <iframe src="about:blank" id="react-refresh-overlay"></iframe> intercepts pointer events')
  }
  const { filterButton, mapExtentFilterCheckbox, modalCloseButton } = selectors
  await page.goto(extentsUrl)
  await modalCloseButton.click()
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
