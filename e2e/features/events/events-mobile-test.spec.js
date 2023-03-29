// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { mockEvents, stormEventSelected } = require('../../test-utils/global-variables/querystrings')

let page
let selectors
let trackMarker

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  })
  page = await context.newPage()
  selectors = createSelectors(page)
  trackMarker = page.locator('#track-marker-2017-05-27')
})

test.afterAll(async () => {
  await page.close()
})

test('Events populated in sidebar', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  const { sidebarButton, sidebarContent, eventsTab, icebergEvent } = selectors
  await page.goto(mockEvents)
  await page.waitForLoadState('networkidle')
  await sidebarButton.click()
  await expect(sidebarContent).toBeVisible()
  await eventsTab.click()
  await page.waitForTimeout(1500)
  await expect(icebergEvent).toBeVisible()
})

test('Clicking event in list closes sidebar and selects marker for event on map', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  const { sidebarButton, sidebarContent, icebergEvent, selectedMarker } = selectors
  await icebergEvent.click()
  await expect(selectedMarker).toBeVisible()
  await expect(sidebarContent).not.toBeVisible()
  await expect(sidebarButton).toBeVisible()
})

test('Events load when arriving via permalink', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  const { sidebarButton, sidebarContent, selectedMarker } = selectors
  await page.goto(stormEventSelected)
  await expect(selectedMarker).toBeVisible()
  await expect(sidebarContent).not.toBeVisible()
  await expect(sidebarButton).toBeVisible()
  await expect(trackMarker).toBeVisible()
})
