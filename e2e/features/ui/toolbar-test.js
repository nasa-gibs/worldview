const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')

const {
  locationSearchComponent,
  locationSearchToolbarButton,
  measureBtn,
  projToolbarButton,
  shareToolbarButton,
  snapshotToolbarButton
} = localSelectors

const TIME_LIMIT = 10000

module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },

  'Verify toolbar buttons are visible by default - excluding Location Search': (c) => {
    c.expect.element(locationSearchComponent).to.be.visible
    c.expect.element(locationSearchToolbarButton).to.not.be.present
    c.expect.element(shareToolbarButton).to.be.visible
    c.expect.element(projToolbarButton).to.be.visible
    c.expect.element(snapshotToolbarButton).to.be.visible
    c.expect.element(measureBtn).to.be.visible
  },

  after: (c) => {
    c.end()
  }
}
