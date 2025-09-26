const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload,
  zoomIn,
  closeModal
} = require('../../test-utils/hooks/wvHooks')
const { joinUrl } = require('../../test-utils/hooks/basicHooks')

let page
let selectors

const startParams = [
  'p=geographic',
  'v=-180,-90,180,90',
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  't=2018-06-01'
]

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('In geographic, top two zoom levels are 10km', async () => {
  const { imageResolution } = selectors
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('10000')
  await closeImageDownloadPanel(page)
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('10000')
  await closeImageDownloadPanel(page)
})

test('Next zoom is 5km', async () => {
  const { imageResolution } = selectors
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('5000')
  await closeImageDownloadPanel(page)
})

test('Next two zooms are 1km', async () => {
  const { imageResolution } = selectors
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('1000')
  await closeImageDownloadPanel(page)
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('1000')
  await closeImageDownloadPanel(page)
})

test('Next zoom is 500m', async () => {
  const { imageResolution } = selectors
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('500')
  await closeImageDownloadPanel(page)
})

test('Next two zooms are 250m', async () => {
  const { imageResolution } = selectors
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('250')
  await closeImageDownloadPanel(page)
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('250')
  await closeImageDownloadPanel(page)
})

test('Next zoom is 125m', async () => {
  const { imageResolution } = selectors
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('125')
  await closeImageDownloadPanel(page)
})

test('Next zoom is 60m', async () => {
  const { imageResolution } = selectors
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('60')
  await closeImageDownloadPanel(page)
})

test('Next zoom is 30m', async () => {
  const { imageResolution } = selectors
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('30')
  await closeImageDownloadPanel(page)
})

test('Last zoom level is 30m', async () => {
  const { imageResolution } = selectors
  await zoomIn(page)
  await openImageDownloadPanel(page)
  await expect(imageResolution).toHaveValue('30')
  await closeImageDownloadPanel(page)
})

test('Confirm bounding box integrity by testing snapshot functionality', async () => {
  await openImageDownloadPanel(page)

  const downloadPromise = page.waitForEvent('download')

  // Verify the bounding box display is present
  const bboxDisplay = page.locator('.wv-image-input-case')
  await expect(bboxDisplay).toBeVisible()

  // Start download and verify progress indicator appears
  await clickDownload(page)
  const progressDialog = page.locator('.wv-snapshot-progress-overlay')
  await expect(progressDialog).toBeVisible()

  const cancelButton = page.locator('button.wv-button.wv-button-red')
  await expect(cancelButton).toBeVisible()

  // Wait for either the download to start or the progress dialog to disappear (timeout after 20s)
  try {
    await Promise.race([
      downloadPromise,
      progressDialog.waitFor({ state: 'detached', timeout: 200_000 }),
      cancelButton.click()
    ])
  } catch (e) {
    throw new Error('Snapshot download did not complete or progress dialog did not disappear in time')
  }

  await closeImageDownloadPanel(page)
})
