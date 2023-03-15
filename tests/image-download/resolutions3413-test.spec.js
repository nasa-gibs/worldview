// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload,
  zoomIn
} = require('../../test-utils/hooks/wvHooks')
const { joinUrl, getAttribute } = require('../../test-utils/hooks/basicHooks')

let page
let selectors

const startParams = [
  'p=arctic',
  'v=-4194304,-3145728,4194304,3145728',
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  't=2018-06-01',
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

test('In the arctic, top zoom levels is 5km', async () => {
  const { imageResolution } = selectors
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('20')
  await closeImageDownloadPanel(page)
})

test('Next two zooms are 1km', async () => {
  const { imageResolution } = selectors
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('4')
  await closeImageDownloadPanel(page)
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('4')
  await closeImageDownloadPanel(page)
})

test('Next zoom is 500m', async () => {
  const { imageResolution } = selectors
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('2')
  await closeImageDownloadPanel(page)
})

test('Next zoom is 250m', async () => {
  const { imageResolution } = selectors
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('1')
  await closeImageDownloadPanel(page)
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('1')
  await closeImageDownloadPanel(page)
})

test('Last zoom level is 250m', async () => {
  const { imageResolution } = selectors
  for (let i = 0; i < 5; i += 1) {
    await zoomIn(page)
  }
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('1')
  await closeImageDownloadPanel(page)
})

test('Confirm bounding box integrity', async () => {
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  const matcher = /BBOX=([^,]+),([^,]+),([^,]+),([^&]+)/
  const matches = matcher.exec(urlAttribute)
  if (matches !== null) {
    const x0 = Number.parseFloat(matches[1])
    const y0 = Number.parseFloat(matches[2])
    const x1 = Number.parseFloat(matches[3])
    const y1 = Number.parseFloat(matches[4])
    expect(x0).toBeLessThan(0)
    expect(x0).toBeGreaterThan(-20000)
    expect(y0).toBeLessThan(0)
    expect(y0).toBeGreaterThan(-20000)
    expect(x1).toBeGreaterThan(0)
    expect(x1).toBeLessThan(20000)
    expect(y1).toBeGreaterThan(0)
    expect(y1).toBeLessThan(20000)
  }
})
