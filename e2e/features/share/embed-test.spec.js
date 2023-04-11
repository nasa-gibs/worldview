// // @ts-check
// const { test, expect } = require('@playwright/test')
// const createSelectors = require('../../test-utils/global-variables/selectors')

// let page
// let selectors
// let context

// test.describe.configure({ mode: 'serial' })

// test.beforeAll(async ({ browser }) => {
//   context = await browser.newContext()
//   page = await context.newPage()
//   selectors = createSelectors(page)
// })

// test.afterAll(async () => {
//   await page.close()
// })

// test('Embed share tab dialog displays embed input', async () => {
//   const { shareToolbarButton, shareEmbedInput } = selectors
//   const queryString = 'http://localhost:3000/?t=2020-01-01'
//   await page.goto(queryString)
//   await shareToolbarButton.click()
//   await page.locator('.embed-share-nav a').click()
//   const objectValue = '<object type="text/html" data="http://localhost:3000/?t=2020-01-01-T00%3A00%3A00Z&em=true" width="100%" height="100%" role="application"></object>'
//   await expect(shareEmbedInput).toHaveValue(objectValue)
// })

// test('Embed share nav link tab disabled if data tab selected', async () => {
//   const { shareToolbarButton } = selectors
//   const queryString = 'http://localhost:3000/?sh=VIIRS_NOAA20_CorrectedReflectance_TrueColor,C1604567932-LANCEMODIS&t=2020-01-01'
//   await page.goto(queryString)
//   await shareToolbarButton.click()
//   const embedDisabled = await page.locator('.embed-share-nav a')
//   await expect(embedDisabled).toHaveClass(/disabled/)
// })

// test('Embed share nav link tab disabled if tour active', async () => {
//   const { shareToolbarButton } = selectors
//   const queryString = 'http://localhost:3000/?tr=swath_gaps'
//   await page.goto(queryString)
//   await shareToolbarButton.click()
//   const embedDisabled = await page.locator('.embed-share-nav a')
//   await expect(embedDisabled).toHaveClass(/disabled/)
// })

// test('Embed mode is active with query string parameter', async () => {
//   const { embedLinkButton } = selectors
//   const queryString = 'http://localhost:3000/?t=2020-01-01&em=true'
//   await page.goto(queryString)
//   await page.locator('.embed-overlay-bg').click()
//   await expect(embedLinkButton).toBeVisible()
// })

// test('Embed mode styling is correct', async () => {
//   const {
//     eventsSidebarTabButton,
//     locationSearchToolbarButton,
//     dataDownloadTabButton,
//     infoToolbarButton,
//     measureBtn,
//     projToolbarButton,
//     shareToolbarButton,
//     snapshotToolbarButton,
//     addLayers,
//     compareButton
//   } = selectors
//   const timelineMobileHeader = await page.locator('.timeline-header-mobile')
//   const mobileDateArrows = await page.locator('.mobile-date-change-arrows-btn')
//   await expect(timelineMobileHeader).toBeVisible()
//   await expect(mobileDateArrows).toBeVisible()
//   await expect(eventsSidebarTabButton).not.toBeVisible()
//   await expect(locationSearchToolbarButton).not.toBeVisible()
//   await expect(dataDownloadTabButton).not.toBeVisible()
//   await expect(infoToolbarButton).not.toBeVisible()
//   await expect(measureBtn).not.toBeVisible()
//   await expect(projToolbarButton).not.toBeVisible()
//   await expect(shareToolbarButton).not.toBeVisible()
//   await expect(snapshotToolbarButton).not.toBeVisible()
//   await expect(addLayers).not.toBeVisible()
//   await expect(compareButton).not.toBeVisible()
// })

// test('Clicking embed link button opens up new tab', async () => {
//   const { embedLinkButton } = selectors
//   await embedLinkButton.click()
//   const pages = await context.pages()
//   const numTabs = pages.length
//   expect(numTabs).toEqual(2)
// })
