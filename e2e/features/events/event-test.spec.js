// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { mockEvents } = require('../../test-utils/global-variables/querystrings')
const { closeModal } = require('../../test-utils/hooks/wvHooks')

let page
let selectors

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Make sure that 4 fire layers are not present in layer list: use mock', async () => {
  const { sidebarEvent, thermAnomSNPPday, thermAnomSNPPnight, thermAnomVIIRSday, thermAnomVIIRSnight } = selectors
  await page.goto(mockEvents)
  await closeModal(page)
  await expect(sidebarEvent).toBeVisible()
  await expect(thermAnomSNPPday).not.toBeVisible()
  await expect(thermAnomSNPPnight).not.toBeVisible()
  await expect(thermAnomVIIRSday).not.toBeVisible()
  await expect(thermAnomVIIRSnight).not.toBeVisible()
})

test('Check that 4 fire layers are now present', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  const { layersTab, sidebarEvent, thermAnomSNPPday, thermAnomSNPPnight, thermAnomVIIRSday, thermAnomVIIRSnight } = selectors
  await page.goto(mockEvents)
  await closeModal(page)
  await sidebarEvent.click()
  await layersTab.click()
  await page.waitForTimeout(5000)
  await expect(thermAnomSNPPday).toBeVisible()
  await expect(thermAnomSNPPnight).toBeVisible()
  await expect(thermAnomVIIRSday).toBeVisible()
  await expect(thermAnomVIIRSnight).toBeVisible()
})

test('Use Mock to make sure appropriate number of event markers are appended to map', async () => {
  const { eventIcons, listOfEvents } = selectors
  await page.goto(mockEvents)
  await closeModal(page)
  await expect(listOfEvents).toBeVisible()
  await expect(eventIcons).toHaveCount(8)
})

test('Selecting event shows track points and markers which are not visible when switched to layer tab', async () => {
  const { eventIcons, eventsTab, layersTab, secondEvent, trackMarker } = selectors
  await page.goto(mockEvents)
  await closeModal(page)
  await page.waitForTimeout(1000)
  await secondEvent.click()
  await page.waitForTimeout(5000)
  await expect(trackMarker).toHaveCount(5)
  await layersTab.hover()
  await page.waitForTimeout(1000)
  await layersTab.click()
  await expect(trackMarker).not.toBeVisible()
  await expect(eventIcons).not.toBeVisible()
  await eventsTab.click()
  await expect(trackMarker).toHaveCount(5)
  await expect(eventIcons).toHaveCount(8)
})

test('Clicking an event in the list selects the event', async () => {
  const { firstEvent, selectedFirstEvent } = selectors
  await firstEvent.click()
  await page.waitForTimeout(6000)
  await expect(selectedFirstEvent).toBeVisible()
})

test('Verify that Url is updated', async () => {
  await page.waitForTimeout(5000)
  await page.goto(mockEvents)
  await closeModal(page)
  const currentUrl = await page.url()
  expect(currentUrl).toContain('efs=true')
  expect(currentUrl).toContain('efa=false')
  expect(currentUrl).toContain('lg=false')
})

test('Verify Events message and clicking message opens dialog', async () => {
  const { firstEvent, notifyMessage } = selectors
  await page.goto(mockEvents)
  await closeModal(page)
  await firstEvent.click()
  await expect(notifyMessage).toBeVisible()
  await expect(notifyMessage).toContainText('Events may not be visible at all times.')
  await notifyMessage.click()
  await expect(page.locator('#event_visibility_info h1')).toContainText('Why can’t I see an event?')
  await closeModal(page)
  await expect(page.locator('#event_visibility_info')).not.toBeVisible()
  await page.locator('#event-alert-close').click()
  await expect(page.locator('.wv-alert .close-alert .fa-times')).not.toBeVisible()
})

test('Clicking selected event deselects event', async () => {
  const { firstEvent, selectedFirstEvent, eventsTab } = selectors
  await page.goto(mockEvents)
  await closeModal(page)
  await firstEvent.click()
  await selectedFirstEvent.click()
  await eventsTab.hover()
  await page.waitForTimeout(5000)
  await expect(selectedFirstEvent).not.toBeVisible()
})
