// @ts-check
const { test, expect } = require('@playwright/test')
const {
  clickDownload,
  closeImageDownloadPanel,
  openImageDownloadPanel,
  switchProjections
} = require('../../test-utils/hooks/wvHooks')
const {
  getAttribute,
  joinUrl,
  selectOption
} = require('../../test-utils/hooks/basicHooks')

let page

const startParams = [
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  'v=-1,-1,1,1',
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

test('JPEG is the default', async () => {
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).not.toContain('WORLDFILE')
  expect(urlAttribute).toContain('FORMAT=image/jpeg')
  await closeImageDownloadPanel(page)
})

test('Add a worldfile', async () => {
  await openImageDownloadPanel(page)
  await selectOption(page, '#wv-image-worldfile', 1)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('WORLDFILE=true')
  await selectOption(page, '#wv-image-worldfile', 0)
  await closeImageDownloadPanel(page)
})

test('Select PNG', async () => {
  await openImageDownloadPanel(page)
  await selectOption(page, '#wv-image-format', 1)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('FORMAT=image/png')
  await closeImageDownloadPanel(page)
})

test('Switch to geographic, select KMZ, switch to arctic, is PNG', async () => {
  await switchProjections(page, 'geographic')
  await openImageDownloadPanel(page)
  await selectOption(page, '#wv-image-format', 3)
  await closeImageDownloadPanel(page)
  await switchProjections(page, 'arctic')
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('FORMAT=image/jpeg')
})
