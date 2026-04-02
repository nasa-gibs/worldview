// // @ts-check
// const { test, expect } = require('@playwright/test')
// const { skipTour } = require('../../test-utils/global-variables/querystrings')
// const createSelectors = require('../../test-utils/global-variables/selectors')
// const { openImageDownloadPanel } = require('../../test-utils/hooks/wvHooks')
// const { clearAndChangeInput } = require('../../test-utils/hooks/basicHooks')

// let page
// let selectors
// let editCoordsTitle
// let editCoordsSubtitle

// const maxLat = '#latlong-input-3'
// const maxLon = '#latlong-input-2'
// const minLat = '#latlong-input-1'
// const minLon = '#latlong-input-0'

// test.describe.configure({ mode: 'serial' })

// test.beforeAll(async ({ browser }) => {
//   page = await browser.newPage()
//   selectors = createSelectors(page)
//   editCoordsTitle = page.locator('.wv-image-input-title span:first-child')
//   editCoordsSubtitle = page.getByRole('heading', { name: 'Top Right' })
// })

// test.afterAll(async () => {
//   await page.close()
// })

// test('Check that image download inputs are hidden on initial load', async () => {
//   await page.goto(skipTour)
//   await openImageDownloadPanel(page)
//   await expect(editCoordsTitle).toHaveText('Edit Coordinates')
//   await expect(editCoordsSubtitle).not.toBeVisible()
// })

// test('Check that image download extent inputs open on click', async () => {
//   await editCoordsTitle.click()
//   await expect(editCoordsSubtitle).toBeVisible()
// })

// test('Verify that input updates crop boundary labels', async () => {
//   const { bboxTopCoords, bboxBottomCoords } = selectors
//   await clearAndChangeInput(page, maxLat, '-14')
//   await clearAndChangeInput(page, maxLon, '14')
//   await clearAndChangeInput(page, minLat, '-40')
//   await clearAndChangeInput(page, minLon, '-20')
//   await page.locator(maxLat).click()
//   await expect(bboxTopCoords).toContainText('-14.0000')
//   await expect(bboxTopCoords).toContainText('14.0000')
//   await expect(bboxBottomCoords).toContainText('-40.0000')
//   await expect(bboxBottomCoords).toContainText('-20.0000')
// })
