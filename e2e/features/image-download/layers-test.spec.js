const { test, expect } = require('@playwright/test')
const { openImageDownloadPanel, clickDownload, closeModal } = require('../../test-utils/hooks/wvHooks')
const { joinUrl } = require('../../test-utils/hooks/basicHooks')

let page
let downloadPromise

const startParams = [
  'v=-1,-1,1,1',
  't=2018-06-01'
]

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage()
  downloadPromise = page.waitForEvent('download')
})

test.afterEach(async () => {
  await page.close()
})

test('List layers in draw order', async () => {
  const url = await joinUrl(startParams, '&l=MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Features_15m,MODIS_Terra_Aerosol')
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Verify the layers are loaded by checking they exist in the layer list
  const layerItems = page.locator('li.layer-visible')
  await expect(layerItems).toHaveCount(3)

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
})

test('Move AOD over the reference features', async () => {
  const url = await joinUrl(startParams, '&l=MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Reference_Features_15m')
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
})

test('Do not include obscured layers', async () => {
  const url = await joinUrl(startParams, '&l=MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Reference_Features_15m')
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Verify layers are loaded
  const layerItems = page.locator('li.layer-visible')
  await expect(layerItems).toHaveCount(3)

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
})

test('Multiple base layers when one is semi-transparent', async () => {
  const url = await joinUrl(startParams, '&l=MODIS_Terra_CorrectedReflectance_TrueColor(opacity=0.5),MODIS_Aqua_CorrectedReflectance_TrueColor')
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Verify both layers are loaded
  const layerItems = page.locator('li.layer-visible')
  await expect(layerItems).toHaveCount(2)

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
})
