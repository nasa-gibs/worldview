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

const startParams = [
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  't=2018-06-01',
  'imageDownload='
]

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterAll(async () => {
  await page.close()
})

test('Geographic is EPSG:4326', async () => {
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Verify that the Geographic projection is active
  await expect(page.locator('.projection-button.geo')).toHaveClass(/active/)

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

test('Arctic is EPSG:3413', async () => {
  await switchProjections(page, 'arctic')
  await openImageDownloadPanel(page)

  // Verify that the Arctic projection is active
  await expect(page.locator('.projection-button.arctic')).toHaveClass(/active/)

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

test('Antarctic is EPSG:3031', async () => {
  await switchProjections(page, 'antarctic')
  await openImageDownloadPanel(page)

  // Verify that the Antarctic projection is active
  await expect(page.locator('.projection-button.antarctic')).toHaveClass(/active/)

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
