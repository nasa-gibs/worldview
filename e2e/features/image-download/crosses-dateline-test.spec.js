// @ts-check
const { test, expect } = require('@playwright/test')

let page

const withinMapURLParams = 'http://localhost:3000/?v=-67.80916012733559,-56.052180562072095,-30.50743102883792,-30.873513420586164&t=2021-08-08-T0'
const crossesPrevDayURLParams = 'http://localhost:3000/?v=161.16767164758798,-54.46571918482002,198.46940074608565,-29.287052043334096&t=2021-08-08-T0'
const crossesNextDayURLParams = 'http://localhost:3000/?v=-198.76946733086245,-59.504883811673906,-161.46773823236478,-34.326216670187975&t=2021-08-08-T0'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterAll(async () => {
  await page.close()
})

test('No dateline alert notification with message if not crossing dateline(s)', async () => {
  await page.goto(withinMapURLParams)
  await page.locator('#wv-image-button').click()
  const datelineAlert = page.locator('#snapshot-dateline-alert')
  await expect(datelineAlert).not.toBeVisible()
})

test('Dateline alert notification with previous day message if crosses previous day dateline', async () => {
  await page.goto(crossesPrevDayURLParams)
  await page.locator('#wv-image-button').click()
  const datelineAlert = page.locator('#snapshot-dateline-alert')
  const datelineAlertMessage = page.locator('#snapshot-dateline-alert .wv-alert-message')
  await expect(datelineAlert).toBeVisible()
  await expect(datelineAlertMessage).toContainText('The selected snapshot area crosses the dateline and uses imagery from the previous day 2021 AUG 07.')
})

test('Dateline alert notification with next day message if crosses next day dateline', async () => {
  await page.goto(crossesNextDayURLParams)
  await page.locator('#wv-image-button').click()
  const datelineAlert = page.locator('#snapshot-dateline-alert')
  const datelineAlertMessage = page.locator('#snapshot-dateline-alert .wv-alert-message')
  await expect(datelineAlert).toBeVisible()
  await expect(datelineAlertMessage).toContainText('The selected snapshot area crosses the dateline and uses imagery from the next day 2021 AUG 09.')
})
