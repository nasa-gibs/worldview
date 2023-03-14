// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')

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

test('date.mob.init.2a: Before 3:00 UTC: load yesterdays date', async () => {
  const { mobileDatePickerSelectBtn } = selectors
  const queryString = 'http://localhost:3000/?now=2013-03-15T0'
  await page.goto(queryString)
  await expect(mobileDatePickerSelectBtn).toContainText('2013 MAR 14')
})

test('date.mob.init.2b: Before 3:00 UTC: right button is not disabled', async () => {
  const { rightArrow } = selectors
  await expect(rightArrow).toBeVisible()
  await expect(rightArrow).not.toHaveClass(/button-disabled/)
  await rightArrow.click()
  await expect(rightArrow).toHaveClass(/button-disabled/)
})

test('date.mob.init.3a: After 3:00 UTC: load todays date', async () => {
  const { mobileDatePickerSelectBtn } = selectors
  const queryString = 'http://localhost:3000/?now=2013-03-15T4'
  await page.goto(queryString)
  await expect(mobileDatePickerSelectBtn).toContainText('2013 MAR 15')
})

test('date.mob.init.3b:After 3:00 UTC: right button is disabled', async () => {
  const { rightArrow } = selectors
  await expect(rightArrow).toBeVisible()
  await expect(rightArrow).toHaveClass(/button-disabled/)
})

test('date.mob.range.1: Date label should show 2013-03-15', async () => {
  const { mobileDatePickerSelectBtn } = selectors
  const queryString = 'http://localhost:3000/?now=2013-03-15T12'
  await page.goto(queryString)
  await expect(mobileDatePickerSelectBtn).toContainText('2013 MAR 15')
})

test('date.mob.range.2: mobile selector header should show 2013 MAR 15', async () => {
  const { mobileDatePickerSelectBtn, mobileDatePickerHeader } = selectors
  await mobileDatePickerSelectBtn.click()
  await expect(mobileDatePickerHeader).toContainText('2013 MAR 15')
})

test('date.mob.range.3: Date label should show 2012 MAR 15 after year drag', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox cant pull datewheel sometimes in testing framework')
  const { mobileDatePickerHeader } = selectors
  const targetYear = await page.getByText('2013', { exact: true })
  const sourceYear = await page.getByText('2012', { exact: true })
  await sourceYear.dragTo(targetYear)
  await expect(mobileDatePickerHeader).toContainText('2012 MAR 15')
})

test('date.mob.range.4: Date in header should be 2012 JAN 15 after month drag', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox cant pull datewheel sometimes in testing framework')
  const { mobileDatePickerHeader } = selectors
  const february = await page.getByText('FEB', { exact: true })
  const march = await page.getByText('MAR', { exact: true })
  const january = await page.getByText('JAN', { exact: true })
  await january.dragTo(february)
  await january.dragTo(march)
  await expect(mobileDatePickerHeader).toContainText('2012 JAN 15')
})

test('date.mob.range.5: Date in header should be 2012 JAN 19 after day drag', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox cant pull datewheel sometimes in testing framework')
  const { mobileDatePickerHeader } = selectors
  const jan15 = await page.getByText('15', { exact: true })
  const jan16 = await page.getByText('16', { exact: true })
  const jan17 = await page.getByText('17', { exact: true })
  const jan18 = await page.getByText('18', { exact: true })
  const jan19 = await page.getByText('19', { exact: true })
  await jan16.dragTo(jan15)
  await jan17.dragTo(jan16)
  await jan18.dragTo(jan17)
  await jan19.dragTo(jan18)
  await expect(mobileDatePickerHeader).toContainText('2012 JAN 19')
})

test('date.mob.range.6: Click okay button verify date has updated', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox cant pull datewheel sometimes in testing framework')
  const { mobileDatePickerSelectBtn } = selectors
  await page.getByText('OK').click()
  await expect(mobileDatePickerSelectBtn).toContainText('2012 JAN 19')
})

test('date.mob.nav.1: Date label should show 2013 JUL 20', async () => {
  const { mobileDatePickerSelectBtn } = selectors
  const queryString = 'http://localhost:3000/?now=2014-03-15&t=2013-07-20T12'
  await page.goto(queryString)
  await expect(mobileDatePickerSelectBtn).toContainText('2013 JUL 20')
})

test('date.mob.nav.2a: mobile selector header should show 2013 JUL 20', async () => {
  const { mobileDatePickerHeader, mobileDatePickerSelectBtn } = selectors
  await mobileDatePickerSelectBtn.click()
  await expect(mobileDatePickerHeader).toContainText('2013 JUL 20')
})

test('date.mob.nav.2b: Year 2014 should be disabled and 2013 is not', async () => {
  const year2014 = await page.getByText('2014')
  const year2013 = await page.getByText('2013', { exact: true })
  await expect(year2014).toHaveClass(/disabled/)
  await expect(year2013).toBeVisible()
})

test('date.mob.nav.3: Date in header should be 2013 FEB 20 after year drag', async () => {
  const { mobileDatePickerHeader } = selectors
  const july = await page.getByText('JUL', { exact: true })
  const june = await page.getByText('JUN', { exact: true })
  const may = await page.getByText('MAY', { exact: true })
  const april = await page.getByText('APR', { exact: true })
  const march = await page.getByText('MAR', { exact: true })
  const february = await page.getByText('FEB', { exact: true })
  await june.dragTo(july)
  await may.dragTo(june)
  await april.dragTo(may)
  await march.dragTo(april)
  await february.dragTo(march)
  await expect(mobileDatePickerHeader).toContainText('2013 FEB 20')
})

test('date.mob.nav.4: Date label should show 2014 FEB 20 after year drag', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox cant pull datewheel sometimes in testing framework')
  const { mobileDatePickerHeader } = selectors
  const targetYear = await page.getByText('2013', { exact: true })
  const sourceYear = await page.getByText('2014', { exact: true })
  await sourceYear.dragTo(targetYear)
  await expect(mobileDatePickerHeader).toContainText('2014 FEB 20')
})

test('date.mob.nav.4: Click okay button verify date has updated to 2014 FEB 20', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox cant pull datewheel sometimes in testing framework')
  const { mobileDatePickerSelectBtn } = selectors
  await page.getByText('OK').click()
  await expect(mobileDatePickerSelectBtn).toContainText('2014 FEB 20')
})
