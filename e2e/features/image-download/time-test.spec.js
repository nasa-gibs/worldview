const { test, expect } = require('@playwright/test')
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload,
  closeModal
} = require('../../test-utils/hooks/wvHooks')
const { joinUrl } = require('../../test-utils/hooks/basicHooks')

let page
let downloadPromise

const startParams = [
  'v=-1,-1,1,1'
]

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  downloadPromise = page.waitForEvent('download')
})

test.afterAll(async () => {
  await page.close()
})

test('Image for today', async () => {
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Verify current date is selected
  const dateDisplay = page.locator('.wv-date-selector-widget')
  await expect(dateDisplay).toBeVisible()

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

test('Image for past date', async () => {
  const url = await joinUrl(startParams, 't=2018-05-31')
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Verify test date is selected
  const dateDisplay = page.locator('.wv-date-selector-widget')
  await expect(dateDisplay).toBeVisible()

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

test('Image for 2018-05-15', async () => {
  const url = await joinUrl(startParams, 't=2018-05-15')
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Verify specific date is selected
  const dateDisplay = page.locator('.wv-date-selector-widget')
  await expect(dateDisplay).toBeVisible()

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
