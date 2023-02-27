const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')

const TIME_LIMIT = 10000

const {
  locationSearchToolbarButton,
  locationSearchMobileDialog
} = localSelectors

module.exports = {
  before (c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.setWindowSize(375, 667) // iPhone 6/7/8 dimensions
    c.pause(300)
  },
  'Location Search mobile dialog is not visible by default': (c) => {
    c.waitForElementVisible(locationSearchToolbarButton, TIME_LIMIT)
    c.expect.element(locationSearchMobileDialog).to.not.be.present
  },
  'Clicking Location Search toolbar button opens the Location Search mobile dialog': (c) => {
    c.waitForElementVisible(locationSearchToolbarButton, TIME_LIMIT)
    c.click(locationSearchToolbarButton)
    c.pause(500)
    c.expect.element(locationSearchMobileDialog).to.be.present
  },
  after (c) {
    c.end()
  }
}
