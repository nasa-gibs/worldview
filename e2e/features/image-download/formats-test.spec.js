const { test, expect } = require('@playwright/test')
const {
  clickDownload,
  closeImageDownloadPanel,
  openImageDownloadPanel,
  switchProjections,
  closeModal
} = require('../../test-utils/hooks/wvHooks')
const {
  joinUrl,
  selectOption
} = require('../../test-utils/hooks/basicHooks')

let page
const startParams = [
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  'v=-1,-1,1,1',
  't=2018-06-01'
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
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Verify JPEG is selected as default format
  const formatSelect = page.locator('#wv-image-format')
  await expect(formatSelect).toHaveValue('image/jpeg')

  // Start download and verify progress indicator appears
  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  // Wait for completion or cancel after reasonable time
  await Promise.race([
    page.locator('.wv-snapshot-progress-dialog').waitFor({ state: 'hidden', timeout: 30000 }),
    page.locator('button:text("Cancel")').click()
  ])

  await closeImageDownloadPanel(page)
})

test('Add a worldfile', async () => {
  await openImageDownloadPanel(page)

  // Enable worldfile option
  await selectOption(page, '#wv-image-worldfile', 1)
  const worldfileSelect = page.locator('#wv-image-worldfile')
  await expect(worldfileSelect).toHaveValue('1')

  // Start download and verify progress indicator appears
  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  // Wait for completion or cancel after reasonable time
  await Promise.race([
    page.locator('.wv-snapshot-progress-dialog').waitFor({ state: 'hidden', timeout: 30000 }),
    page.locator('button:text("Cancel")').click()
  ])

  // Reset worldfile option
  await selectOption(page, '#wv-image-worldfile', 0)
  await closeImageDownloadPanel(page)
})

test('Select PNG', async () => {
  await openImageDownloadPanel(page)

  // Select PNG format
  await selectOption(page, '#wv-image-format', 1)
  const formatSelect = page.locator('#wv-image-format')
  await expect(formatSelect).toHaveValue('image/png')

  // Start download and verify progress indicator appears
  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  // Wait for completion or cancel after reasonable time
  await Promise.race([
    page.locator('.wv-snapshot-progress-dialog').waitFor({ state: 'hidden', timeout: 30000 }),
    page.locator('button:text("Cancel")').click()
  ])

  await closeImageDownloadPanel(page)
})

test('Switch to geographic, select KMZ, switch to arctic, is JPEG', async () => {
  await switchProjections(page, 'geographic')
  await openImageDownloadPanel(page)

  // Select KMZ format
  await selectOption(page, '#wv-image-format', 3)
  const formatSelect = page.locator('#wv-image-format')
  await expect(formatSelect).toHaveValue('application/vnd.google-earth.kmz')

  await closeImageDownloadPanel(page)
  await switchProjections(page, 'arctic')
  await openImageDownloadPanel(page)

  // Verify format defaulted back to JPEG in arctic projection
  const arcticFormatSelect = page.locator('#wv-image-format')
  await expect(arcticFormatSelect).toHaveValue('image/jpeg')

  // Start download and verify progress indicator appears
  await clickDownload(page)
  await expect(page.locator('.wv-snapshot-progress-dialog')).toBeVisible()

  // Wait for completion or cancel after reasonable time
  await Promise.race([
    page.locator('.wv-snapshot-progress-dialog').waitFor({ state: 'hidden', timeout: 30000 }),
    page.locator('button:text("Cancel")').click()
  ])
})
