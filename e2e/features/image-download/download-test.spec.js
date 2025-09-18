const { test, expect } = require('@playwright/test')
const {
  openImageDownloadPanel,
  clickDownload,
  closeModal
} = require('../../test-utils/hooks/wvHooks')
const { joinUrl } = require('../../test-utils/hooks/basicHooks')
const fs = require('fs')
const path = require('path')

let page

const startParams = [
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  'v=-1,-1,1,1',
  't=2018-06-01'
]
const downloadDir = 'test-downloads'

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterEach(async () => {
  await page.close()
})

test('download button downloads an image', async () => {
  test.setTimeout(200_500)
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  const downloadPromise = page.waitForEvent('download')

  // Start download and verify progress indicator appears
  await clickDownload(page)

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()
  await expect(suggestedFilename).toMatch('snapshot-2018-06-01T00_00_00.000Z.jpeg')

  fs.mkdirSync(downloadDir, { recursive: true }) // Create the directory if it doesn't exist
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

  const downloadPromise = page.waitForEvent('download')
  await clickDownload(page)

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()
  await expect(suggestedFilename).toMatch('snapshot-2018-06-01T00_00_00.000Z.png')

  fs.mkdirSync(downloadDir, { recursive: true })
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

  const downloadPromise = page.waitForEvent('download')
  await clickDownload(page)

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()
  await expect(suggestedFilename).toMatch('snapshot-2018-06-01T00_00_00.000Z.tif')

  fs.mkdirSync(downloadDir, { recursive: true })
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

  const downloadPromise = page.waitForEvent('download')
  await clickDownload(page)

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()
  await expect(suggestedFilename).toMatch('snapshot-2018-06-01T00_00_00.000Z.tif')

  fs.mkdirSync(downloadDir, { recursive: true })
  const filePath = path.join(downloadDir, suggestedFilename)
  await download.saveAs(filePath)

  expect(fs.existsSync(filePath)).toBeTruthy()
  const fileStats = fs.statSync(filePath)
  expect(fileStats.size).toBeGreaterThan(0)
  expect(fileStats.size).toEqual(128488856) // Expected size for 5000m GeoTIFF of entire globe

  fs.unlinkSync(filePath)
})

test('download KMZ format with larger area', async () => {
  test.setTimeout(200_500)
  const largeAreaParams = [
    'l=MODIS_Terra_CorrectedReflectance_TrueColor',
    'v=-10,-10,10,10', // Larger viewport
    't=2018-06-01'
  ]

  const url = await joinUrl(largeAreaParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Change format to KMZ
  const formatSelect = page.locator('#wv-image-format')
  await formatSelect.selectOption('application/vnd.google-earth.kmz')

  // Set resolution to 1km for larger area
  const resolutionSelect = page.locator('#wv-image-resolution')
  await resolutionSelect.selectOption('1000')

  const downloadPromise = page.waitForEvent('download')
  await clickDownload(page)

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()
  await expect(suggestedFilename).toMatch('snapshot-2018-06-01T00_00_00.000Z.kmz')

  fs.mkdirSync(downloadDir, { recursive: true })
  const filePath = path.join(downloadDir, suggestedFilename)
  await download.saveAs(filePath)

  expect(fs.existsSync(filePath)).toBeTruthy()
  const fileStats = fs.statSync(filePath)
  expect(fileStats.size).toBeGreaterThan(0)

  fs.unlinkSync(filePath)
})

test('download with different date and layers', async () => {
  test.setTimeout(200_500)
  const multiLayerParams = [
    'l=MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Aqua_CorrectedReflectance_TrueColor',
    'v=-5,-5,5,5',
    't=2020-01-15'
  ]

  const url = await joinUrl(multiLayerParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  const downloadPromise = page.waitForEvent('download')
  await clickDownload(page)

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()
  await expect(suggestedFilename).toMatch('snapshot-2020-01-15T00_00_00.000Z.jpeg')

  fs.mkdirSync(downloadDir, { recursive: true })
  const filePath = path.join(downloadDir, suggestedFilename)
  await download.saveAs(filePath)

  expect(fs.existsSync(filePath)).toBeTruthy()
  const fileStats = fs.statSync(filePath)
  expect(fileStats.size).toBeGreaterThan(0)

  fs.unlinkSync(filePath)
})

test('download Arctic projection with PNG format', async () => {
  test.setTimeout(200_500)
  const arcticParams = [
    'p=arctic',
    'l=MODIS_Terra_CorrectedReflectance_TrueColor',
    'v=-1000000,-1000000,1000000,1000000',
    't=2018-06-01'
  ]

  const url = await joinUrl(arcticParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Change format to PNG (KMZ not available in polar projections)
  const formatSelect = page.locator('#wv-image-format')
  await formatSelect.selectOption('image/png')

  // Set appropriate resolution for Arctic
  const resolutionSelect = page.locator('#wv-image-resolution')
  await resolutionSelect.selectOption('1000')

  const downloadPromise = page.waitForEvent('download')
  await clickDownload(page)

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()
  await expect(suggestedFilename).toMatch('snapshot-2018-06-01T00_00_00.000Z.png')

  fs.mkdirSync(downloadDir, { recursive: true })
  const filePath = path.join(downloadDir, suggestedFilename)
  await download.saveAs(filePath)

  expect(fs.existsSync(filePath)).toBeTruthy()
  const fileStats = fs.statSync(filePath)
  expect(fileStats.size).toBeGreaterThan(0)

  fs.unlinkSync(filePath)
})

test('download with high resolution (60m)', async () => {
  test.setTimeout(200_500)
  const highResParams = [
    'l=MODIS_Terra_CorrectedReflectance_TrueColor',
    'v=-0.5,-0.5,0.5,0.5', // Small area for high resolution
    't=2018-06-01'
  ]

  const url = await joinUrl(highResParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Set high resolution
  const resolutionSelect = page.locator('#wv-image-resolution')
  await resolutionSelect.selectOption('60')

  const downloadPromise = page.waitForEvent('download')
  await clickDownload(page)

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()
  await expect(suggestedFilename).toMatch('snapshot-2018-06-01T00_00_00.000Z.jpeg')

  fs.mkdirSync(downloadDir, { recursive: true })
  const filePath = path.join(downloadDir, suggestedFilename)
  await download.saveAs(filePath)

  expect(fs.existsSync(filePath)).toBeTruthy()
  const fileStats = fs.statSync(filePath)
  expect(fileStats.size).toBeGreaterThan(0)

  fs.unlinkSync(filePath)
})

test('download with Antarctic projection and GeoTIFF', async () => {
  test.setTimeout(200_500)
  const antarcticParams = [
    'p=antarctic',
    'l=MODIS_Terra_CorrectedReflectance_TrueColor',
    'v=-1000000,-1000000,1000000,1000000',
    't=2018-06-01'
  ]

  const url = await joinUrl(antarcticParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Change format to GeoTIFF
  const formatSelect = page.locator('#wv-image-format')
  await formatSelect.selectOption('image/tiff')

  // Set resolution to 500m
  const resolutionSelect = page.locator('#wv-image-resolution')
  await resolutionSelect.selectOption('500')

  const downloadPromise = page.waitForEvent('download')
  await clickDownload(page)

  const download = await downloadPromise
  const suggestedFilename = download.suggestedFilename()
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()
  await expect(suggestedFilename).toMatch('snapshot-2018-06-01T00_00_00.000Z.tif')

  fs.mkdirSync(downloadDir, { recursive: true })
  const filePath = path.join(downloadDir, suggestedFilename)
  await download.saveAs(filePath)

  expect(fs.existsSync(filePath)).toBeTruthy()
  const fileStats = fs.statSync(filePath)
  expect(fileStats.size).toBeGreaterThan(0)

  fs.unlinkSync(filePath)
})
