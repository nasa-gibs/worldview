// const { chromium, firefox, webkit } = require('@playwright/test')

// const launchBrowser = async (browserName, url) => {
//   const browser = await { chromium, firefox, webkit }[browserName].launch()
//   const page = await browser.newPage()
//   await page.goto(url)
//   return page
// }

// const launchBrowserSkipTour = async (browserName, url) => {
//   const browser = await { chromium, firefox, webkit }[browserName].launch()
//   const page = await browser.newPage()
//   await page.goto(url)
//   await page.getByRole('link', { name: 'Start using @NAME@' }).click()
//   return page
// }

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
  await page.locator('#toolbar_snapshot .close').click()
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

module.exports = {
  clickDownload,
  dateSelectorMonthDay,
  closeImageDownloadPanel,
  openImageDownloadPanel,
  switchProjections,
  timelineDrag
}
