// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')

let page
let selectors

const kioskQueryStringGeo = 'http://localhost:3000/?v=-250.17116762774398,-114.67919463709383,250.62557403459047,109.37518092954436&df=true&kiosk=true&l=Coastlines_15m,OrbitTracks_Terra_Descending,MODIS_Terra_CorrectedReflectance_TrueColor&lg=true'
const kioskQueryStringArctic = 'http://localhost:3000/?v=-9215416.788865805,-4212995.281243633,9489665.699466601,4155580.686192584&p=arctic&df=true&kiosk=true&eic=da&l=Land_Mask,AMSRU2_Sea_Ice_Concentration_12km(palette=blue_6)&lg=true'
const kioskQueryStringAntarctic = 'http://localhost:3000/?v=-9215416.788865805,-4212995.281243633,9489665.699466601,4155580.686192584&p=antarctic&df=true&kiosk=true&eic=da&l=Land_Mask,AMSRU2_Sea_Ice_Concentration_12km(palette=blue_6)&lg=true'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

// helper to confirm target els are removed/hidden in kiosk mode
const kioskModeValidElsRemoved = async () => {
  const {
    infoToolbarButton,
    locationSearchToolbarButton,
    measureBtn,
    projToolbarButton,
    shareToolbarButton,
    snapshotToolbarButton,
    timelineHeader,
    zoomInButton,
    zoomOutButton,
    sidebarContainer,
    mapRotateLeft,
    mapRotateReset,
    mapRotateRight,
    distractionFreeExitBtn
  } = selectors

  const uiElements = [
    infoToolbarButton,
    locationSearchToolbarButton,
    measureBtn,
    projToolbarButton,
    shareToolbarButton,
    snapshotToolbarButton,
    timelineHeader,
    zoomInButton,
    zoomOutButton,
    sidebarContainer,
    distractionFreeExitBtn,
    mapRotateLeft,
    mapRotateReset,
    mapRotateRight
  ]

  for (const el of uiElements) {
    await expect(el).not.toBeVisible()
  }
}

test('Loading into kiosk mode in geographic projection displays the correct UI elements', async () => {
  await page.goto(kioskQueryStringGeo)
  const distractionFreeTimeline = page.locator('#distraction-free-timeline')
  const wvLogo = page.locator('#wv-logo')
  await expect(distractionFreeTimeline).toBeVisible()
  await expect(wvLogo).toBeVisible()
  await kioskModeValidElsRemoved()
})

test('Loading into kiosk mode in arctic projection displays the correct UI elements', async () => {
  await page.goto(kioskQueryStringArctic)
  const distractionFreeTimeline = page.locator('#distraction-free-timeline')
  const wvLogo = page.locator('#wv-logo')
  await expect(distractionFreeTimeline).toBeVisible()
  await expect(wvLogo).toBeVisible()
  await kioskModeValidElsRemoved()
})

test('Loading into kiosk mode in antarctic projection displays the correct UI elements', async () => {
  await page.goto(kioskQueryStringAntarctic)
  const distractionFreeTimeline = page.locator('#distraction-free-timeline')
  const wvLogo = page.locator('#wv-logo')
  await expect(distractionFreeTimeline).toBeVisible()
  await expect(wvLogo).toBeVisible()
  await kioskModeValidElsRemoved()
})
