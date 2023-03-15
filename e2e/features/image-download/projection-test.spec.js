// @ts-check
const { test, expect } = require('@playwright/test')
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload
} = require('../../test-utils/hooks/wvHooks')
const { joinUrl, getAttribute } = require('../../test-utils/hooks/basicHooks')
const { switchProjections } = require('../../test-utils/hooks/wvHooks')

let page
const startParams = [
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  't=2018-06-01',
  'imageDownload='
]

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterAll(async () => {
  await page.close()
})

test('Geographic is EPSG:4326', async () => {
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('CRS=EPSG:4326')
  await closeImageDownloadPanel(page)
})

test('Arctic is EPSG:3413', async () => {
  await switchProjections(page, 'arctic')
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('CRS=EPSG:3413')
  await closeImageDownloadPanel(page)
})

test('Antarctic is EPSG:3031', async () => {
  await switchProjections(page, 'antarctic')
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('CRS=EPSG:3031')
  await closeImageDownloadPanel(page)
})
