const { expect } = require('@playwright/test')

/**
 * Switches the projection
 * @param {Object} page - Playwright object representing the browser page.
 * @param {string} proj - The specified projection ex: 'geographic', 'arctic' etc..
 */
const switchProjections = async (page, proj) => {
  await page.locator('#wv-proj-button').click()
  await page.locator(`#change-${proj}-button`).click()
}

const openImageDownloadPanel = async (page) => {
  await page.locator('#wv-image-button').click()
}

const clickDownload = async (page) => {
  await page.locator('.wv-image-button').click()
}

const closeImageDownloadPanel = async (page) => {
  await page.locator('.modal-close-btn').click()
}

const zoomIn = async (page) => {
  await page.locator('button.wv-map-zoom-in').click()
}

const zoomOut = async (page) => {
  await page.locator('button.wv-map-zoom-out').click()
}

/**
 * Drag one of the draggers on the timeline.
 * To find the x parameter you need to inspect the exact date on the timeline you want to drag to
 * and find the x attribute value in the rect element.
 * @param {Object} page - Playwright object representing the browser page.
 * @param {string} draggerEl - 'a' or 'b'. Represents draggerA or draggerB
 * @param {string} x - Represents exact point on timeline to drag to.
 */
const timelineDrag = async (page, draggerEl, x) => {
  const draggerA = await page.locator('.timeline-dragger.draggerA')
  const draggerB = await page.locator('.timeline-dragger.draggerB')
  const dragger = draggerEl === 'a' ? draggerA : draggerB
  const dragDate = `rect.axis-grid-rect[width="12"][height="65"][x="${x}"][fill="transparent"]`
  const dragLocation = await page.locator(dragDate)
  await dragger.dragTo(dragLocation)
}

/**
 * Returns the month date of date selector ex: 'AUG17'
 * @param {Object} page - Playwright object representing the browser page.
 */
const dateSelectorMonthDay = async (page) => {
  const dateSelectorDayInput = await page.locator('#date-selector-main .input-wrapper-day input')
  const dateSelectorMonthInput = await page.locator('#date-selector-main .input-wrapper-month input')
  const day = dateSelectorDayInput.innerText()
  const month = dateSelectorMonthInput.innerText()
  return month + day
}

const assertDefaultLayers = async (page) => {
  const layerItem = page.locator('.item.productsitem')
  const refLabels = page.locator('#active-Reference_Labels_15m')
  const refFeatures = page.locator('#active-Reference_Features_15m')
  const coastlines = page.locator('#active-Coastlines_15m')
  const trueColorSNPP = page.locator('#active-VIIRS_SNPP_CorrectedReflectance_TrueColor')
  const trueColorAqua = page.locator('#active-MODIS_Aqua_CorrectedReflectance_TrueColor')
  const trueColorMODIS = page.locator('#active-MODIS_Terra_CorrectedReflectance_TrueColor')
  const trueColorNOAA = page.locator('#active-VIIRS_NOAA20_CorrectedReflectance_TrueColor')
  await expect(layerItem).toHaveCount(7)
  await expect(refLabels).toBeVisible()
  await expect(refFeatures).toBeVisible()
  await expect(coastlines).toBeVisible()
  await expect(trueColorSNPP).toBeVisible()
  await expect(trueColorAqua).toBeVisible()
  await expect(trueColorMODIS).toBeVisible()
  await expect(trueColorNOAA).toBeVisible()
}

const assertCategories = async (page) => {
  const categoriesContainer = page.locator('.category-masonry-case')
  const legacy = page.locator('#legacy-all')
  const airQuality = page.locator('#air-quality')
  const ashPlumes = page.locator('#ash-plumes')
  const drought = page.locator('#drought')
  const fires = page.locator('#fires')
  const floods = page.locator('#floods')
  const shipping = page.locator('#shipping')
  const dust = page.locator('#dust-storms')
  const storms = page.locator('#severe-storms')
  const smoke = page.locator('#smoke-plumes')
  const vegetation = page.locator('#vegetation')
  const other = page.locator('#legacy-other')
  await expect(categoriesContainer).toBeVisible()
  await expect(legacy).toBeVisible()
  await expect(airQuality).toBeVisible()
  await expect(ashPlumes).toBeVisible()
  await expect(drought).toBeVisible()
  await expect(fires).toBeVisible()
  await expect(floods).toBeVisible()
  await expect(shipping).toBeVisible()
  await expect(dust).toBeVisible()
  await expect(storms).toBeVisible()
  await expect(smoke).toBeVisible()
  await expect(vegetation).toBeVisible()
  await expect(other).toBeVisible()
}

/**
 * Check the layer order in the sidebar and compare it agaisnt an array of ordered layers
 * @param {Object} page - Playwright object representing the browser page.
 * @param {string} layerContainer - A string for identifying each layer <li> element in the sidebar
 * @param {Array} orderedLayers - An array of strings representing the expected layer ordering
 */
const assertLayerOrdering = async (page, layerContainer, orderedLayers) => {
  const layers = await page.$$(layerContainer)
  const layerIDs = await Promise.all(layers.map(async (layer) => {
    const layerID = await layer.getAttribute('id')
    return layerID
  }))
  expect(layerIDs).toEqual(orderedLayers)
}

/**
 * Create a distance measurement
 * @param {Object} page - Playwright object representing the browser page.
 * @param {Array} start - An array of two integers representing the starting x & y position
 * @param {Array} finish - An array of two integers representing the starting x & y position
 */
const createDistanceMeasurement = async (page, start, finish) => {
  await page.locator('#wv-measure-button').click()
  await page.locator('#measure-distance-button').click()
  await page.mouse.click(start[0], start[1])
  await page.mouse.dblclick(finish[0], finish[1])
}

const createAreaMeasurement = async (page, pointOne, pointTwo, pointThree) => {
  await page.locator('#wv-measure-button').click()
  await page.locator('#measure-area-button').click()
  await page.mouse.click(pointOne[0], pointOne[1])
  await page.mouse.click(pointTwo[0], pointTwo[1])
  await page.mouse.dblclick(pointThree[0], pointThree[1])
}

const localStorageEnabled = () => {
  let enabled
  try {
    if (window.localStorage) {
      const uid = new Date().toString()
      window.localStorage.setItem(uid, uid)
      enabled = window.localStorage.getItem(uid) === uid
      window.localStorage.removeItem(uid)
    }
  } catch (error) {
    enabled = false
  }
  return !!enabled
}

/**
 * Some react switches & buttons may have unexpected behavior when tested at high speeds
 * This adds a custom pause after a click to ensure the switch behaves properly
 * @param {Object} page - Playwright object representing the browser page.
 * @param {String} locator - A string for identifying the react switch label
 */
const clickAndWait = async (page, locator) => {
  await page.locator(locator).click()
  await page.waitForTimeout(200)
}

module.exports = {
  assertCategories,
  assertDefaultLayers,
  assertLayerOrdering,
  clickDownload,
  closeImageDownloadPanel,
  createAreaMeasurement,
  createDistanceMeasurement,
  dateSelectorMonthDay,
  localStorageEnabled,
  openImageDownloadPanel,
  clickAndWait,
  switchProjections,
  timelineDrag,
  zoomIn,
  zoomOut
}
