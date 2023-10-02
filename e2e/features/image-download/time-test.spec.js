// @ts-check
const { test, expect } = require('@playwright/test')
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload
} = require('../../test-utils/hooks/wvHooks')
const { joinUrl, getAttribute } = require('../../test-utils/hooks/basicHooks')
const createSelectors = require('../../test-utils/global-variables/selectors')

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
  const { modalCloseButton } = selectors
  const url = await joinUrl(startParams, '&now=2018-06-01T3')
  await page.goto(url)
  await modalCloseButton.click()
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('TIME=2018-06-01')
  await closeImageDownloadPanel(page)
})

test('Image for yesterday', async () => {
  const { modalCloseButton } = selectors
  const url = await joinUrl(startParams, '&now=2018-06-01T0')
  await page.goto(url)
  await modalCloseButton.click()
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('TIME=2018-05-31')
  await closeImageDownloadPanel(page)
})

test('Image for 2018-05-15', async () => {
  const { modalCloseButton } = selectors
  const url = await joinUrl(startParams, '&t=2018-05-15')
  await page.goto(url)
  await modalCloseButton.click()
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('TIME=2018-05-15')
  await closeImageDownloadPanel(page)
})
