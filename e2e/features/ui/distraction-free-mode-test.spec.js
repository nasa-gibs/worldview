// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')

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

// helper to confirm target els are removed/hidden in distraction free mode
const distractionFreeModeValidElsRemoved = async (proj, isActive) => {
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
    mapRotateRight
  } = selectors

  let uiElements = [
    infoToolbarButton,
    locationSearchToolbarButton,
    measureBtn,
    projToolbarButton,
    shareToolbarButton,
    snapshotToolbarButton,
    timelineHeader,
    zoomInButton,
    zoomOutButton,
    sidebarContainer
  ]

  // add rotate buttons for polar projections
  if (proj !== 'geographic') {
    uiElements = [
      ...uiElements,
      mapRotateLeft,
      mapRotateReset,
      mapRotateRight
    ]
  }

  if (isActive) {
    // distraction free mode is active and els should be removed/hidden
    for (const el of uiElements) {
      await expect(el).not.toBeVisible()
    }
  } else {
    // els should be added/visible
    for (const el of uiElements) {
      await expect(el).toBeVisible()
    }
  }
}

test('Enabling distraction free mode with shortcut key hides UI elements', async () => {
  const { locationSearchMinimizeButton, infoToolbarButton } = selectors
  const queryString = 'http://localhost:3000/?p=arctic'
  await page.goto(queryString)
  await locationSearchMinimizeButton.click()
  await infoToolbarButton.click()
  await page.locator('#distraction_free_info_item').click()
  await page.locator('#distraction-free-mode-active-alert-close').click()
  await distractionFreeModeValidElsRemoved('arctic', true)
})

test('Disabling distraction free mode with shortcut key returns UI elements', async () => {
  await page.keyboard.press('Shift+D')
  await distractionFreeModeValidElsRemoved('arctic', false)
})

test('Enabling distraction free mode activates query string parameter df', async () => {
  const queryString = 'http://localhost:3000/?df=true'
  await page.goto(queryString)
  await distractionFreeModeValidElsRemoved('geographic', true)
})
