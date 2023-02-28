// @ts-check
const { test, expect } = require('@playwright/test')

let page
const mockEventsUrl = 'http://localhost:3000/?p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m&t=2018-05-02-T00%3A00%3A00Z&z=3&v=-409.00147812273656,-205.62883007565202,270.5880270080828,219.11461063111003&e=true&mockEvents=20170530'
const stormEventSelectedUrl = 'http://localhost:3000/?v=175.65863037109375,10.918751525878907,182.25042724609375,22.643360900878907&e=EONET_2777,2017-05-31&l=IMERG_Precipitation_Rate,VIIRS_SNPP_DayNightBand_ENCC(hidden),VIIRS_SNPP_DayNightBand_At_Sensor_Radiance(hidden),Reference_Labels,Reference_Features,Coastlines(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor,MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor(hidden)&lg=true&t=2017-05-31-T00%3A00%3A00Z&mockEvents=20170530'
let sidebarButton
let sidebarContent
let eventsTab
let icebergEvent
let selectedMarker
let trackMarker

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  })
  page = await context.newPage()

  sidebarButton = page.locator('#accordion-toggler-button')
  sidebarContent = page.locator('#products-holder')
  eventsTab = page.locator('#events-sidebar-tab')
  icebergEvent = page.locator('#wv-events #sidebar-event-EONET_2703')
  selectedMarker = page.locator('.marker.selected')
  trackMarker = page.locator('#track-marker-2017-05-27')
})

test.afterAll(async () => {
  await page.close()
})

test('Events populated in sidebar', async () => {
  await page.goto(mockEventsUrl)

  await sidebarButton.click()

  await expect(sidebarContent).toBeVisible()

  await eventsTab.click()

  await expect(icebergEvent).toBeVisible()
})

test('Clicking event in list closes sidebar and selects marker for event on map', async () => {
  await icebergEvent.click()

  await expect(selectedMarker).toBeVisible()
  await expect(sidebarContent).not.toBeVisible()
  await expect(sidebarButton).toBeVisible()
})

test('Events load when arriving via permalink', async () => {
  await page.goto(stormEventSelectedUrl)

  await expect(selectedMarker).toBeVisible()
  await expect(sidebarContent).not.toBeVisible()
  await expect(sidebarButton).toBeVisible()
  await expect(trackMarker).toBeVisible()
})
