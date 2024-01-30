// @ts-check
const { test, expect } = require('@playwright/test')
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload
} = require('../../test-utils/hooks/wvHooks')
const { joinUrl, getAttribute } = require('../../test-utils/hooks/basicHooks')
const createSelectors = require('../../test-utils/global-variables/selectors')
const moment = require('moment')

let page
let selectors

const startParams = [
  'imageDownload='
]

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Image for today', async () => {
  if (process.env.SOTO === 'true') {
    test.skip(true, 'Bug Reported for SOTO: https://github.com/podaac/worldview/issues/33')
  }
  const todayDate = '2018-06-01'
  const url = await joinUrl(startParams, '&now=' + todayDate + 'T3')
  const { modalCloseButton } = selectors
  await page.goto(url)
  await modalCloseButton.click()
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('TIME=' + todayDate)
  await closeImageDownloadPanel(page)
})

test('Image for yesterday', async () => {
  if (process.env.SOTO === 'true') {
    test.skip(true, 'Bug Reported for SOTO: https://github.com/podaac/worldview/issues/33')
  }
  const todayDate = '2018-06-01'
  const expectedDate = moment.utc(todayDate, 'YYYY-MM-DD').subtract(1, 'days').format('YYYY-MM-DD').toUpperCase()
  const url = await joinUrl(startParams, '&now=' + todayDate + 'T0')
  const { modalCloseButton } = selectors
  await page.goto(url)
  await modalCloseButton.click()
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('TIME=' + expectedDate)
  await closeImageDownloadPanel(page)
})

test('Image for 2018-05-15', async () => {
  const expectedDate = '2018-05-15'
  const url = await joinUrl(startParams, '&t=' + expectedDate)
  const { modalCloseButton } = selectors
  await page.goto(url)
  await modalCloseButton.click()
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('TIME=' + expectedDate)
  await closeImageDownloadPanel(page)
})
