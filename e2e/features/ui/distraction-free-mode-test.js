const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')

const {
  infoToolbarButton,
  locationSearchMinimizeButton,
  locationSearchToolbarButton,
  mapRotateLeft,
  mapRotateReset,
  mapRotateRight,
  measureBtn,
  projToolbarButton,
  shareToolbarButton,
  sidebarContainer,
  snapshotToolbarButton,
  timelineHeader,
  zoomInButton,
  zoomOutButton
} = localSelectors
const TIME_LIMIT = 5000

const closeDistractionFreeAlert = (c) => {
  c.waitForElementVisible('#distraction-free-mode-active-alert-close')
  c.click('#distraction-free-mode-active-alert-close')
}

// helper to confirm target els are removed/hidden in distraction free mode
const distractionFreeModeValidElsRemoved = (c, proj, isActive) => {
  let presentEls = [
    infoToolbarButton,
    locationSearchToolbarButton,
    measureBtn,
    projToolbarButton,
    shareToolbarButton,
    snapshotToolbarButton,
    timelineHeader,
    zoomInButton,
    zoomOutButton
  ]
  const visibleEls = [
    sidebarContainer
  ]

  // add rotate buttons for polar projections
  if (proj !== 'geographic') {
    presentEls = [
      ...presentEls,
      mapRotateLeft,
      mapRotateReset,
      mapRotateRight
    ]
  }

  if (isActive) {
    // distraction free mode is active and els should be removed/hidden
    presentEls.forEach((el) => c.waitForElementNotPresent(el, TIME_LIMIT))
    visibleEls.forEach((el) => c.waitForElementNotVisible(el, TIME_LIMIT))
  } else {
    // els should be added/visible
    presentEls.forEach((el) => c.waitForElementPresent(el, TIME_LIMIT))
    visibleEls.forEach((el) => c.waitForElementVisible(el, TIME_LIMIT))
  }
}

module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.url(`${c.globals.url}?p=arctic`)
    // ensure Location Search is minimized
    c.click(locationSearchMinimizeButton)
  },

  // verify distraction free mode shortcut hides ui elements
  'Enabling distraction free mode with shortcut key hides UI elements': (c) => {
    c.waitForElementVisible(infoToolbarButton)
    c.click(infoToolbarButton)
    c.waitForElementVisible('#distraction_free_info_item')
    c.click('#distraction_free_info_item')

    closeDistractionFreeAlert(c)
    distractionFreeModeValidElsRemoved(c, 'arctic', true)
  },

  // verify turning off distraction free mode shortcut returns hidden ui elements
  'Disabling distraction free mode with shortcut key returns UI elements': (c) => {
    c.sendKeys('body', [c.Keys.SHIFT, 'd', c.Keys.NULL])
    c.pause(300)

    distractionFreeModeValidElsRemoved(c, 'arctic', false)
  },

  // verify distraction free mode activates with query string parameter df (in geographic projection)
  'Enabling distraction free mode activates query string parameter df': (c) => {
    c.url(`${c.globals.url}?df=true`)

    distractionFreeModeValidElsRemoved(c, 'geographic', true)
  },

  after: (c) => {
    c.end()
  }
}
