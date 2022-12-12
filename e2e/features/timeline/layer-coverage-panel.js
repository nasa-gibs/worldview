const reuseables = require('../../reuseables/skip-tour.js')
const localQueryStrings = require('../../reuseables/querystrings.js')

const layerCoverageContainer = '.timeline-layer-coverage-container'
const layerCoverageHandle = '#timeline-layer-coverage-panel-handle'
const matchingLayerCoverageAxisLine = '.axis-matching-layer-coverage-line'
const TIME_LIMIT = 20000

module.exports = {
  beforeEach: (client) => {
    reuseables.loadAndSkipTour(client, TIME_LIMIT)
  },

  // verify default layer coverage is visible on the timeline axis
  'Layer coverage is shown by default': (client) => {
    client.waitForElementVisible(matchingLayerCoverageAxisLine, TIME_LIMIT)
  },

  // verify no layer coverage is visible on the timeline axis with just reference layers loaded
  'No layer coverage is shown by default': (client) => {
    client.url(client.globals.url + localQueryStrings.referenceLayersOnly)
    client.waitForElementVisible(layerCoverageHandle, TIME_LIMIT)
    client.expect.element(matchingLayerCoverageAxisLine).to.not.be.present
  },

  // verify panel is hidden and handle is visible on page load
  'Panel is hidden on page load': (client) => {
    client.waitForElementVisible(layerCoverageHandle, TIME_LIMIT)
  },

  // verify panel opens on handle click
  'Panel opens on handle click': (client) => {
    client.waitForElementVisible(layerCoverageHandle, TIME_LIMIT)
    client
      .click(layerCoverageHandle)
      .pause(1000)
    client.expect.element(layerCoverageContainer).to.be.visible
  },

  // verify no hidden layers are visible by default on page load
  'No hidden layers are visible in layer panel by default': (client) => {
    client.waitForElementVisible(layerCoverageHandle, TIME_LIMIT)
    client
      .click(layerCoverageHandle)
      .pause(1000)
    client.expect.element(layerCoverageContainer).to.be.visible
    client.elements('css selector', '.layer-coverage-layer-list > div', (result) => {
      client.assert.equal(result.value.length, 1)
    })
  },

  after: (client) => {
    client.end()
  }
}
