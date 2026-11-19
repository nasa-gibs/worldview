// @ts-check
const { test, expect } = require('@playwright/test')
const {
  openImageDownloadPanel,
  clickDownload,
  closeModal
} = require('../../test-utils/hooks/wvHooks')
const { joinUrl } = require('../../test-utils/hooks/basicHooks')
const fs = require('fs')
const path = require('path')

/** @type {import('@playwright/test').Page} */
let page
/** @type {Promise<import("playwright-core").Download>} */
let downloadPromise

const startParams = [
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  'v=-1,-1,1,1',
  't=2018-06-01'
]
const subdailyParams = [
  'l=TEMPO_L2_Formaldehyde_Vertical_Column_Granule(count=1)',
  'v=-1,-1,1,1',
  't=2024-06-01'
]
const downloadDir = 'test-downloads'

test.beforeAll(() => {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir)
  }
})

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage()
  downloadPromise = page.waitForEvent('download')
})

test.afterEach(async () => {
  await page.close()
})

test.afterAll(() => {
  if (fs.existsSync(downloadDir)) {
    fs.rmdirSync(downloadDir, { recursive: true })
  }
})

test('download button downloads an image', async () => {
  test.setTimeout(200_500)
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Start download and verify progress indicator appears
  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(suggestedFilename).toMatch('snapshot-2018-06-01.jpeg')

  const filePath = path.join(downloadDir, suggestedFilename)

  // Save the downloaded file
  await download.saveAs(filePath)

  // Assert that the file exists
  expect(fs.existsSync(filePath)).toBeTruthy()

  // Check file size is greater than 0
  const fileStats = fs.statSync(filePath)
  expect(fileStats.size).toBeGreaterThan(0)

  // Clean up the downloaded file (optional)
  fs.unlinkSync(filePath)
})

test('download PNG format with different resolution', async () => {
  test.setTimeout(200_500)
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Change format to PNG
  const formatSelect = page.locator('#wv-image-format')
  await formatSelect.selectOption('image/png')

  // Change resolution to 250m
  const resolutionSelect = page.locator('#wv-image-resolution')
  await resolutionSelect.selectOption('250')

  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(suggestedFilename).toMatch('snapshot-2018-06-01.png')

  const filePath = path.join(downloadDir, suggestedFilename)
  await download.saveAs(filePath)

  expect(fs.existsSync(filePath)).toBeTruthy()
  const fileStats = fs.statSync(filePath)
  expect(fileStats.size).toBeGreaterThan(0)

  fs.unlinkSync(filePath)
})

test('download GeoTIFF with worldfile enabled', async () => {
  test.setTimeout(200_500)
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Change format to GeoTIFF
  const formatSelect = page.locator('#wv-image-format')
  await formatSelect.selectOption('image/tiff')

  // Enable worldfile
  const worldfileCheckbox = page.locator('#wv-image-worldfile')
  await worldfileCheckbox.selectOption('1')

  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(suggestedFilename).toMatch('snapshot-2018-06-01.tif')

  const filePath = path.join(downloadDir, suggestedFilename)
  await download.saveAs(filePath)

  expect(fs.existsSync(filePath)).toBeTruthy()
  const fileStats = fs.statSync(filePath)
  expect(fileStats.size).toBeGreaterThan(0)

  fs.unlinkSync(filePath)
})

test('download GeoTIFF with entire globe selected', async () => {
  test.setTimeout(200_500)
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Change format to GeoTIFF
  const formatSelect = page.locator('#wv-image-format')
  await formatSelect.selectOption('image/tiff')

  const resolutionSelect = page.locator('#wv-image-resolution')
  await resolutionSelect.selectOption('5000')

  // Select entire globe
  const globeCheckbox = page.locator('#image-global-cb')
  await globeCheckbox.click()

  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(suggestedFilename).toMatch('snapshot-2018-06-01.tif')

  const filePath = path.join(downloadDir, suggestedFilename)
  await download.saveAs(filePath)

  expect(fs.existsSync(filePath)).toBeTruthy()
  const fileStats = fs.statSync(filePath)
  expect(fileStats.size).toBeGreaterThan(0)

  fs.unlinkSync(filePath)
})

test('download PNG format with subdaily layer', async () => {
  test.setTimeout(200_500)
  const url = await joinUrl(subdailyParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Change format to PNG
  const formatSelect = page.locator('#wv-image-format')
  await formatSelect.selectOption('image/png')

  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(suggestedFilename).toMatch('snapshot-2024-06-01T00_00_59.000Z.png')

  const filePath = path.join(downloadDir, suggestedFilename)
  await download.saveAs(filePath)

  expect(fs.existsSync(filePath)).toBeTruthy()
  const fileStats = fs.statSync(filePath)
  expect(fileStats.size).toBeGreaterThan(0)

  fs.unlinkSync(filePath)
})
