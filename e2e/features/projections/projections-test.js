const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')
const { switchProjection } = require('../../reuseables/switch-projection')

const {
  geographicMap,
  arcticMap,
  antarcticMap,
  projToolbarButton
} = localSelectors

const TIME_LIMIT = 10000

module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },

  // A button with a projection (globe) icon is visible and unobstructed, map shows data in a geographic projection
  'Verify default page shows projection toolbar button in geographic projection map': (c) => {
    c.expect.element(projToolbarButton).to.be.visible
    c.expect.element(geographicMap).to.be.visible
  },

  // Select "Arctic" from the menu. The map shows data in a stereographic projection centered at the North Pole.
  'Verify changing projection to arctic switches map to arctic': (c) => {
    switchProjection(c, 'arctic')
    c.expect.element(arcticMap).to.be.visible
  },

  // Select "Antarctic" from the menu. The map shows data in a stereographic projection centered at the South Pole.
  'Verify changing projection to antarctic switches map to antarctic': (c) => {
    switchProjection(c, 'antarctic')
    c.expect.element(antarcticMap).to.be.visible
  },

  after: (c) => {
    c.end()
  }
}
