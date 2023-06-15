// @ts-check
const { test, expect } = require('@playwright/test')
const { skipTour } = require('../../test-utils/global-variables/querystrings')
const createSelectors = require('../../test-utils/global-variables/selectors')
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  switchProjections
} = require('../../test-utils/hooks/wvHooks')

let page
let selectors

const expectedResolutions = '30m60m125m250m500m1km5km10km'
const expectedFormats = 'JPEGPNGGeoTIFFKMZ'
const expectedWorldFile = 'NoYes'
const expectedSize = '8200px x 8200px'
const expectedPolarFormats = 'JPEGPNGGeoTIFF'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Check resolutions', async () => {
  const { imageResolution } = selectors
  await page.goto(skipTour)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toContainText(expectedResolutions)
})

test('Check formats', async () => {
  const { imageFormat } = selectors
  await expect(imageFormat).toHaveText(expectedFormats)
})

test('Check worldfile option', async () => {
  const { imageWorldFile } = selectors
  await expect(imageWorldFile).toHaveText(expectedWorldFile)
})

test('Check max size', async () => {
  const { imageMaxSize } = selectors
  await expect(imageMaxSize).toHaveText(expectedSize)
})

test('Check arctic formats', async () => {
  const { imageFormat } = selectors
  await closeImageDownloadPanel(page)
  await switchProjections(page, 'arctic')
  await openImageDownloadPanel(page)
  await expect(imageFormat).toHaveText(expectedPolarFormats)
})

test('Check antarctic formats', async () => {
  const { imageFormat } = selectors
  await closeImageDownloadPanel(page)
  await switchProjections(page, 'antarctic')
  await openImageDownloadPanel(page)
  await expect(imageFormat).toHaveText(expectedPolarFormats)
})
