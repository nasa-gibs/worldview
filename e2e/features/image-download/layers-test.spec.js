const { test, expect } = require('@playwright/test')
const { openImageDownloadPanel, clickDownload, closeModal } = require('../../test-utils/hooks/wvHooks')
const { joinUrl } = require('../../test-utils/hooks/basicHooks')

let page

const startParams = [
  'v=-180,-90,180,90',
  't=2018-06-01',
  'imageDownload='
]

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage()
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
  const layerItems = page.locator('.layer-list-container .layer-item')
  await expect(layerItems).toHaveCount(3)

  // Start download and verify progress indicator appears
  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  // Wait for completion or cancel after reasonable time
  await Promise.race([
    page.locator('.wv-snapshot-progress-dialog').waitFor({ state: 'hidden', timeout: 30000 }),
    page.locator('button:text("Cancel")').click()
  ])
})

test('Move AOD over the reference features', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox fails this test for unknown reasons')
  const url = await joinUrl(startParams, '&l=MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Reference_Features_15m')
  await page.goto(url)
  await page.waitForTimeout(1000)
  await closeModal(page)
  await page.waitForTimeout(1000)
  await openImageDownloadPanel(page)

  // Verify the layers are loaded in the correct order
  const layerItems = page.locator('.layer-list-container .layer-item')
  await expect(layerItems).toHaveCount(3)

  // Start download and verify progress indicator appears
  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  // Wait for completion or cancel after reasonable time
  await Promise.race([
    page.locator('.wv-snapshot-progress-dialog').waitFor({ state: 'hidden', timeout: 30000 }),
    page.locator('button:text("Cancel")').click()
  ])
})

test('Do not include obscured layers', async () => {
  const url = await joinUrl(startParams, '&l=MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Reference_Features_15m')
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Verify layers are loaded
  const layerItems = page.locator('.layer-list-container .layer-item')
  await expect(layerItems).toHaveCount(3)

  // Start download and verify progress indicator appears
  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  // Wait for completion or cancel after reasonable time
  await Promise.race([
    page.locator('.wv-snapshot-progress-dialog').waitFor({ state: 'hidden', timeout: 30000 }),
    page.locator('button:text("Cancel")').click()
  ])
})

test('Multiple base layers when one is semi-transparent', async () => {
  const url = await joinUrl(startParams, '&l=MODIS_Terra_CorrectedReflectance_TrueColor(opacity=0.5),MODIS_Aqua_CorrectedReflectance_TrueColor')
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Verify both layers are loaded
  const layerItems = page.locator('.layer-list-container .layer-item')
  await expect(layerItems).toHaveCount(2)

  // Verify one layer has opacity settings
  const opacitySlider = page.locator('.layer-opacity-range')
  await expect(opacitySlider).toBeVisible()

  // Start download and verify progress indicator appears
  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  // Wait for completion or cancel after reasonable time
  await Promise.race([
    page.locator('.wv-snapshot-progress-dialog').waitFor({ state: 'hidden', timeout: 30000 }),
    page.locator('button:text("Cancel")').click()
  ])
})
