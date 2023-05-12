// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { mockEvents } = require('../../test-utils/global-variables/querystrings')

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

test('Make sure that 4 fire layers are not present in layer list: use mock', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  const { sidebarEvent, thermAnomSNPPday, thermAnomSNPPnight, thermAnomVIIRSday, thermAnomVIIRSnight } = selectors
  await page.goto(mockEvents)
  await expect(sidebarEvent).toBeVisible()
  await expect(thermAnomSNPPday).not.toBeVisible()
  await expect(thermAnomSNPPnight).not.toBeVisible()
  await expect(thermAnomVIIRSday).not.toBeVisible()
  await expect(thermAnomVIIRSnight).not.toBeVisible()
})

test('Check that 4 fire layers are now present', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  const { sidebarEvent, thermAnomSNPPday, thermAnomSNPPnight, thermAnomVIIRSday, thermAnomVIIRSnight, layersTab } = selectors
  await sidebarEvent.click()
  await layersTab.click()
  await expect(thermAnomSNPPday).toBeVisible()
  await expect(thermAnomSNPPnight).toBeVisible()
  await expect(thermAnomVIIRSday).toBeVisible()
  await expect(thermAnomVIIRSnight).toBeVisible()
})

test('Use Mock to make sure appropriate number of event markers are appended to map', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  const { listOfEvents, eventIcons } = selectors
  await page.goto(mockEvents)
  await expect(listOfEvents).toBeVisible()
  await expect(eventIcons).toHaveCount(8)
})

test('Selecting event shows track points and markers which are not visible when switched to layer tab', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  const { secondEvent, trackMarker, eventIcons, eventsTab, layersTab } = selectors
  await page.waitForTimeout(1000)
  await secondEvent.click()
  await page.waitForTimeout(5000)
  await expect(trackMarker).toHaveCount(5)
  await layersTab.click()
  await expect(trackMarker).not.toBeVisible()
  await expect(eventIcons).not.toBeVisible()
  await eventsTab.click()
  await expect(trackMarker).toHaveCount(5)
  await expect(eventIcons).toHaveCount(8)
})

test('Clicking an event in the list selects the event', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  const { firstEvent, selectedFirstEvent } = selectors
  await page.goto(mockEvents)
  await page.waitForLoadState('networkidle')
  await firstEvent.click()
  await page.waitForTimeout(5000)
  await expect(selectedFirstEvent).toBeVisible()
})

test('Verify that Url is updated', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  await page.waitForTimeout(5000)
  const currentUrl = await page.url()
  expect(currentUrl).toContain('efs=true')
  expect(currentUrl).toContain('efa=false')
  expect(currentUrl).toContain('lg=false')
})

test('Verify Events message and clicking message opens dialog', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  const { notifyMessage, modalCloseButton } = selectors
  await expect(notifyMessage).toBeVisible()
  await expect(notifyMessage).toContainText('Events may not be visible at all times.')
  await notifyMessage.click()
  await expect(page.locator('#event_visibility_info h1')).toContainText('Why can’t I see an event?')
  await modalCloseButton.click()
  await expect(page.locator('#event_visibility_info')).not.toBeVisible()
  await page.locator('#event-alert-close').click()
  await expect(page.locator('.wv-alert .close-alert .fa-times')).not.toBeVisible()
})

test('Clicking selected event deselects event', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  const { selectedFirstEvent } = selectors
  await selectedFirstEvent.click()
  await page.waitForTimeout(5000)
  await expect(selectedFirstEvent).not.toBeVisible()
})
