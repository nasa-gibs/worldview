// @ts-check
const { test, expect } = require('@playwright/test')
const { switchProjections } = require('../../test-utils/hooks/hooks')

const fixedAppNow = 'http://localhost:3000/?now=2012-01-01T00%3A00%3A00Z'
const wildfiresWithDates = 'http://localhost:3000/?v=-139.02635001706034,25.660099233568406,-85.27770827186355,43.288373996427595&e=true&efs=false&efd=2020-01-16,2020-06-16&efc=wildfires&t=2020-06-16-T18%3A31%3A28Z'
const backwardsCompatibleEventUrl = 'http://localhost:3000/?v=-49.6224609375,13.940234375000001,-26.5775390625,37.459765625&e=EONET_1874,2005-12-31&l=IMERG_Precipitation_Rate,Reference_Labels_15m,Reference_Features_15m,MODIS_Terra_CorrectedReflectance_TrueColor&lg=true&t=2005-12-31-T00%3A00%3A00Z'
const extentsUrl = 'http://localhost:3000/?e=true&efs=false'

let page
let eventsTab
let filterIcons
let dustHazeIcon
let volcanoesIcon
let wildfiresIcon
let filterDates
let filterButton
let filterModalApply
let filterModalCancel
let dustSwitch
let manmadeSwitch
let seaLakeIceSwitch
let severeStormsSwitch
let snowSwitch
let volcanoesSwitch
let watercolorSwitch
let wildfiresSwitch
let mapExtentFilterCheckbox
let startInputYear
let startInputMonth
let startInputDay
let endInputYear
let endInputMonth
let endInputDay

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  eventsTab = page.locator('#events-sidebar-tab')
  filterIcons = page.locator('.filter-icons > .event-icon')
  dustHazeIcon = page.locator('.filter-icons > #filter-dust-and-haze')
  volcanoesIcon = page.locator('.filter-icons > #filter-volcanoes')
  wildfiresIcon = page.locator('.filter-icons > #filter-wildfires')
  filterDates = page.locator('.filter-dates')
  filterButton = page.locator('#event-filter-button')
  filterModalApply = page.locator('#filter-apply-btn')
  filterModalCancel = page.locator('#filter-cancel-btn')
  dustSwitch = page.locator('#dustHaze-switch')
  manmadeSwitch = page.locator('#manmade-switch')
  seaLakeIceSwitch = page.locator('#seaLakeIce-switch')
  severeStormsSwitch = page.locator('#severeStorms-switch')
  snowSwitch = page.locator('#snow-switch')
  volcanoesSwitch = page.locator('#volcanoes-switch')
  watercolorSwitch = page.locator('#waterColor-switch')
  wildfiresSwitch = page.locator('#wildfires-switch')
  mapExtentFilterCheckbox = page.locator('#map-extent-filter')
  startInputYear = page.locator('#year-event-filter-start')
  startInputMonth = page.locator('#month-event-filter-start')
  startInputDay = page.locator('#day-event-filter-start')
  endInputYear = page.locator('#year-event-filter-end')
  endInputMonth = page.locator('#month-event-filter-end')
  endInputDay = page.locator('#day-event-filter-end')
})

const assertDateInputValues = async (start, end) => {
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
  await page.goto(fixedAppNow)
  await eventsTab.click()

  await expect(filterIcons).toHaveCount(8)
  await expect(filterDates).toContainText('2011 SEP 02 - 2011 DEC 31')
})

test('Filter modal inputs are correct', async () => {
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
  const currentUrl = page.url()

  expect(currentUrl).toContain('e=true')
  expect(currentUrl).toContain('efc=dustHaze,manmade,seaLakeIce,severeStorms,snow,volcanoes,waterColor,wildfires')
  expect(currentUrl).toContain('efd=2011-09-02,2011-12-31')
  expect(currentUrl).toContain('efs=true')
})

test('Loading from permalink sets all criteria properly', async () => {
  await page.goto(wildfiresWithDates)

  const currentUrl = page.url()

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
  await page.goto(wildfiresWithDates)

  await filterButton.click()
  await startInputYear.click()
  await startInputYear.type('2000')
  await startInputMonth.click()
  await startInputMonth.type('APR')
  await startInputDay.click()
  await startInputDay.type('19')
  await endInputYear.click()
  await endInputYear.type('2001')
  await endInputMonth.click()
  await endInputMonth.type('NOV')
  await endInputDay.click()
  await endInputDay.type('11')

  const wildfiresSwitchEl = page.locator('#wildfires-switch + .react-switch-label')
  const dustSwitchEl = page.locator('#dustHaze-switch + .react-switch-label')
  const volcanoesSwitchEl = page.locator('#volcanoes-switch + .react-switch-label')

  await wildfiresSwitchEl.click()
  await dustSwitchEl.click()
  await volcanoesSwitchEl.click()

  await filterModalCancel.click()

  await expect(filterDates).toContainText('2020 JAN 16 - 2020 JUN 16')
  await expect(filterIcons).toHaveCount(1)
  await expect(wildfiresIcon).toBeVisible()
})

test('Opening modal after cancelling changed values shows previous unchanged values', async () => {
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
  await startInputYear.click()
  await startInputYear.fill('2000')
  await startInputMonth.click()
  await startInputMonth.fill('APR')
  await startInputDay.click()
  await startInputDay.fill('19')
  await endInputYear.click()
  await endInputYear.fill('2001')
  await endInputMonth.click()
  await endInputMonth.fill('NOV')
  await endInputDay.click()
  await endInputDay.fill('11')

  const wildfiresSwitchEl = page.locator('#wildfires-switch + .react-switch-label')
  const dustSwitchEl = page.locator('#dustHaze-switch + .react-switch-label')
  const volcanoesSwitchEl = page.locator('#volcanoes-switch + .react-switch-label')

  await wildfiresSwitchEl.click()
  await dustSwitchEl.click()
  await volcanoesSwitchEl.click()

  await filterModalApply.click()

  await expect(filterDates).toContainText('2000 APR 19 - 2001 NOV 11')
  await expect(filterIcons).toHaveCount(2)
  await expect(dustHazeIcon).toBeVisible()
  await expect(volcanoesIcon).toBeVisible()
  await expect(wildfiresIcon).not.toBeVisible()
})

test('Event Selected, No Filter Params: Shows only day of event, all categories, checkbox unchecked', async () => {
  await page.goto(backwardsCompatibleEventUrl)

  await expect(filterDates).toContainText('2005 DEC 31 - 2005 DEC 31')

  await filterButton.click()

  await assertDateInputValues('2005-DEC-31', '2005-DEC-31')
  await expect(filterIcons).toHaveCount(8)
  await expect(mapExtentFilterCheckbox).not.toBeChecked()
  await filterModalCancel.click()
})

test('No extent search checkbox in polar projections', async () => {
  await page.goto(extentsUrl)

  await filterButton.click()

  await expect(mapExtentFilterCheckbox).toBeVisible()
  await expect(mapExtentFilterCheckbox).toBeChecked()

  await filterModalCancel.click()

  await switchProjections(page, 'arctic')
  await filterButton.click()
  await expect(mapExtentFilterCheckbox).not.toBeVisible()
  await filterModalCancel.click()

  await switchProjections(page, 'geographic')
  await page.waitForTimeout(5000)
  await filterButton.click()
  await expect(mapExtentFilterCheckbox).toBeChecked()
  await filterModalCancel.click()

  await switchProjections(page, 'antarctic')
  await filterButton.click()
  await expect(mapExtentFilterCheckbox).not.toBeVisible()
  await filterModalCancel.click()
})
