const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')
const localQueryStrings = require('../../reuseables/querystrings.js')

const {
  aTab,
  bTab,
  compareButton,
  compareButtonText,
  compareMobileSelectToggle,
  collapsedLayerButton,
  layerContainer,
  mobileDatePickerSelectButton,
  swipeDragger
} = localSelectors

const aMobileCompareButton = `${compareMobileSelectToggle} > div:nth-child(1)`
const bMobileCompareButton = `${compareMobileSelectToggle} > div:nth-child(2)`

const TIME_LIMIT = 10000
module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.setWindowSize(375, 667) // iPhone 6/7/8 dimensions
  },

  // load SWIPE and verify that it is active
  'Mobile SWIPE is loaded': (c) => {
    c.url(c.globals.url + localQueryStrings.swipeAndAIsActive)
    c.waitForElementVisible(swipeDragger, TIME_LIMIT)
  },

  // load SWIPE and verify mobile compare A|B toggle buttons are visible
  'Mobile comparison A|B toggle buttons are visible and only A is selected by default': (c) => {
    c.waitForElementVisible(compareMobileSelectToggle, TIME_LIMIT)
    c.assert.cssClassPresent(aMobileCompareButton, 'compare-btn-selected')
    c.assert.not.cssClassPresent(bMobileCompareButton, 'compare-btn-selected')
  },

  // toggle select B change compare mode date to B
  'Toggling to B compare side changes mobile date picker date': (c) => {
    // confirm initial A mobile date picker date
    c.waitForElementVisible(mobileDatePickerSelectButton, TIME_LIMIT, (e) => {
      c.assert.containsText(mobileDatePickerSelectButton, '2018 AUG 17')
    })
    // click B compare toggle button and confirm B mobile date picker date
    c.click(bMobileCompareButton)
    c.waitForElementVisible(mobileDatePickerSelectButton, TIME_LIMIT, (e) => {
      c.assert.containsText(mobileDatePickerSelectButton, '2018 AUG 16')
    })
  },

  'Expand mobile layer list and confirm comparison mode button is present and toggles compare mode': (c) => {
    c.click(collapsedLayerButton)
    c.waitForElementVisible(layerContainer, TIME_LIMIT, (e) => {
      c.assert.elementPresent(compareButton)
      c.assert.elementPresent(aTab)
      c.assert.elementPresent(bTab)
      c.assert.containsText(compareButtonText, 'Exit Comparison Mode')
    })

    c.click(compareButton)
    c.waitForElementVisible(compareButtonText, TIME_LIMIT, (e) => {
      c.assert.elementNotPresent(aTab)
      c.assert.elementNotPresent(bTab)
      c.assert.elementPresent(compareButton)
      c.assert.containsText(compareButtonText, 'Start Comparison Mode')
    })
  },

  // B compare button toggle is selected on B permalink load and A is not selected
  'B compare button toggle is only selected on B permalink load': (c) => {
    c.url(c.globals.url + localQueryStrings.spyAndBIsActive)
    c.waitForElementVisible(swipeDragger, TIME_LIMIT)
    c.assert.not.cssClassPresent(aMobileCompareButton, 'compare-btn-selected')
    c.assert.cssClassPresent(bMobileCompareButton, 'compare-btn-selected')
  },

  // load comparison SPY mode and verify that it reverts to SWIPE mode
  'Mobile SPY mode reverts to SWIPE mode': (c) => {
    c.url(c.globals.url + localQueryStrings.spyAndBIsActive)
    c.waitForElementVisible(swipeDragger, TIME_LIMIT)
    c.pause(500)
  },

  // load comparison OPACITY mode and verify that it reverts to SWIPE mode
  'Mobile OPACITY mode reverts to SWIPE mode': (c) => {
    c.url(c.globals.url + localQueryStrings.opacityAndBIsActive)
    c.waitForElementVisible(swipeDragger, TIME_LIMIT)
    c.pause(500)
  },

  after (c) {
    c.end()
  }
}
