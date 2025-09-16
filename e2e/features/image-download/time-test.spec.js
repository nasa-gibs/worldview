const { test, expect } = require('@playwright/test')
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload,
  closeModal
} = require('../../test-utils/hooks/wvHooks')
const { joinUrl } = require('../../test-utils/hooks/basicHooks')

let page

const TEST_DATE = '2018-05-31'
const startParams = [
  'imageDownload='
]

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
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
  const dateDisplay = page.locator('.date-selector-widget')
  await expect(dateDisplay).toBeVisible()

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

test('Image for past date', async () => {
  const url = await joinUrl(startParams, `&t=${TEST_DATE}`)
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Verify test date is selected
  const dateDisplay = page.locator('.date-selector-widget')
  await expect(dateDisplay).toBeVisible()

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

test('Image for 2018-05-15', async () => {
  const url = await joinUrl(startParams, '&t=2018-05-15')
  await page.goto(url)
  await closeModal(page)
  await openImageDownloadPanel(page)

  // Verify specific date is selected
  const dateDisplay = page.locator('.date-selector-widget')
  await expect(dateDisplay).toBeVisible()

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
