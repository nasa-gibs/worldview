// @ts-check
const { test, expect } = require('@playwright/test')

const url = 'http://localhost:3000/?p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m&t=2018-05-02-T00%3A00%3A00Z&z=3&v=-409.00147812273656,-205.62883007565202,270.5880270080828,219.11461063111003&e=true&mockEvents=20170530'
let page
let listOfEvents
let eventIcons
let firstEvent
let secondEvent
let selectedFirstEvent
let trackMarker
let layersTab
let sidebarEvent
let thermAnomSNPPday
let thermAnomSNPPnight
let thermAnomVIIRSday
let thermAnomVIIRSnight
let eventsTab
let notifyMessage

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  listOfEvents = page.locator('#wv-events ul.map-item-list')
  eventIcons = page.locator('.marker .event-icon')
  firstEvent = page.locator('#wv-events ul.map-item-list .item:first-child h4')
  secondEvent = page.locator('#wv-events #sidebar-event-EONET_99999')
  selectedFirstEvent = page.locator('#wv-events ul.map-item-list .item-selected:first-child h4')
  trackMarker = page.locator('.track-marker')
  layersTab = page.locator('#layers-sidebar-tab')
  sidebarEvent = page.locator('#sidebar-event-EONET_3931')
  thermAnomSNPPday = page.locator('#active-VIIRS_SNPP_Thermal_Anomalies_375m_Night')
  thermAnomSNPPnight = page.locator('#active-VIIRS_SNPP_Thermal_Anomalies_375m_Day')
  thermAnomVIIRSday = page.locator('#active-VIIRS_NOAA20_Thermal_Anomalies_375m_Day')
  thermAnomVIIRSnight = page.locator('#active-VIIRS_NOAA20_Thermal_Anomalies_375m_Night')
  eventsTab = page.locator('#events-sidebar-tab')
  notifyMessage = page.locator('.wv-alert .alert-content')
})

test.afterAll(async () => {
  await page.close()
})

test('Make sure that 4 fire layers are not present in layer list: use mock', async () => {
  await page.goto(url)

  await expect(sidebarEvent).toBeVisible()
  await expect(thermAnomSNPPday).not.toBeVisible()
  await expect(thermAnomSNPPnight).not.toBeVisible()
  await expect(thermAnomVIIRSday).not.toBeVisible()
  await expect(thermAnomVIIRSnight).not.toBeVisible()
})

test('Check that 4 fire layers are now present', async () => {
  await sidebarEvent.click()
  await layersTab.click()

  await expect(thermAnomSNPPday).toBeVisible()
  await expect(thermAnomSNPPnight).toBeVisible()
  await expect(thermAnomVIIRSday).toBeVisible()
  await expect(thermAnomVIIRSnight).toBeVisible()
})

test('Use Mock to make sure appropriate number of event markers are appended to map', async () => {
  await page.goto(url)

  await expect(listOfEvents).toBeVisible()
  await expect(eventIcons).toHaveCount(8)
})


test('Selecting event shows track points and markers which are not visible when switched to layer tab', async () => {
  await secondEvent.click()

  await expect(trackMarker).toHaveCount(5)

  await layersTab.click()

  await expect(trackMarker).not.toBeVisible()
  await expect(eventIcons).not.toBeVisible()

  await eventsTab.click()

  await expect(trackMarker).toHaveCount(5)
  await expect(eventIcons).toHaveCount(8)
})

test('Clicking an event in the list selects the event', async () => {
  await page.goto(url)

  await firstEvent.click()

  await expect(selectedFirstEvent).toBeVisible()
})

test('Verify that Url is updated', async () => {
  await page.waitForTimeout(5000)

  const currentUrl = await page.url()

  expect(currentUrl).toContain('efs=true')
  expect(currentUrl).toContain('efa=false')
  expect(currentUrl).toContain('lg=false')
})

test('Verify Events message and clicking message opens dialog', async () => {
  await expect(notifyMessage).toBeVisible()

  await expect(notifyMessage).toContainText('Events may not be visible at all times.')

  await notifyMessage.click()

  await expect(page.locator('#event_visibility_info h1')).toContainText('Why can’t I see an event?')

  await page.locator('#event_visibility_info .close').click()

  await expect(page.locator('#event_visibility_info')).not.toBeVisible()

  await page.locator('.wv-alert .close-alert .fa-times').click()

  await expect(page.locator('.wv-alert .close-alert .fa-times')).not.toBeVisible()
})

test('Clicking selected event deselects event', async () => {
  await selectedFirstEvent.click()

  await expect(selectedFirstEvent).not.toBeVisible()
})

