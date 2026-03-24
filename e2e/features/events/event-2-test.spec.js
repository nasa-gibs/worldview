// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { mockEvents } = require('../../test-utils/global-variables/querystrings')
const { closeModal } = require('../../test-utils/hooks/wvHooks')

/** @type {import('@playwright/test').Page} */
let page
/** @type {Record<string, import('@playwright/test').Locator>} */
let selectors
test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Selecting event shows track points and markers which are not visible when switched to layer tab', async () => {
  const { eventIcons, eventsTab, layersTab, secondEvent, trackMarker } = selectors
  await page.goto(mockEvents)
  await closeModal(page)
  await page.waitForTimeout(1500)
  await secondEvent.click()
  await expect(trackMarker).toHaveCount(5, { timeout: 10000 })
  await layersTab.hover()
  await page.waitForTimeout(500)
  await layersTab.click()
  await expect(trackMarker).not.toBeVisible()
  await expect(eventIcons).not.toBeVisible()
  await eventsTab.click()
  await expect(trackMarker).toHaveCount(5)
  await expect(eventIcons).toHaveCount(8)
})

test('Clicking an event in the list selects the event', async () => {
  const { firstEvent, selectedFirstEvent } = selectors
  await page.waitForTimeout(500)
  await expect(firstEvent).toBeVisible()
  await firstEvent.click()
  await page.waitForTimeout(250)
  await expect(selectedFirstEvent).toBeVisible()
})
