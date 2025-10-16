const { test, expect } = require('@playwright/test')
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload,
  closeModal
} = require('../../test-utils/hooks/wvHooks')
const { joinUrl } = require('../../test-utils/hooks/basicHooks')
const { switchProjections } = require('../../test-utils/hooks/wvHooks')

let page
let downloadPromise

const startParams = [
  'v=-1,-1,1,1',
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  't=2018-06-01'
]

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  downloadPromise = page.waitForEvent('download')
})

test.afterAll(async () => {
  await page.close()
})

test('Geographic is EPSG:4326', async () => {
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Start download and verify progress indicator appears
  await clickDownload(page)

  const progressDialog = page.locator('.wv-snapshot-progress-overlay')
  await expect(progressDialog).toBeVisible()

  const cancelButton = page.locator('#wv-snapshot-cancel-button')
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

test('Arctic is EPSG:3413', async () => {
  await switchProjections(page, 'arctic')
  await openImageDownloadPanel(page)

  // Start download and verify progress indicator appears
  await clickDownload(page)
  const progressDialog = page.locator('.wv-snapshot-progress-overlay')
  await expect(progressDialog).toBeVisible()

  const cancelButton = page.locator('#wv-snapshot-cancel-button')
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

test('Antarctic is EPSG:3031', async () => {
  await switchProjections(page, 'antarctic')
  await openImageDownloadPanel(page)

  // Start download and verify progress indicator appears
  await clickDownload(page)

  const progressDialog = page.locator('.wv-snapshot-progress-overlay')
  await expect(progressDialog).toBeVisible()

  const cancelButton = page.locator('#wv-snapshot-cancel-button')
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
