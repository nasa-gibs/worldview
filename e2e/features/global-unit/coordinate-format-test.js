const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')

const {
  infoToolbarButton
} = localSelectors

const TIME_LIMIT = 5000
const settingsInfoItem = '#settings_info_item'
const globalSettingsModal = '#global_settings_modal'
const latlondmSettingsButton = '#latlon-dm-btn'
const latlonddSettingsButton = '#latlon-dd-btn'
const tooltipCoordinates = '.tooltip-coordinates'
const coordinatesMapBtn = '#coords-panel'
const copyCoordsToClipboardBtn = '#copy-coordinates-to-clipboard-button'

const locationMarkerQueryString = '?v=-97.7284840660436,15.91105901837444,-63.44259121174646,45.128898266232824&s=-81.3507,28.5946&t=2022-08-09-T15%3A32%3A01Z'

module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },

  'Click the change coordinate format map button changes the active coordinate format selection in global settings': (c) => {
    c.url(c.globals.url + locationMarkerQueryString)

    c.click(copyCoordsToClipboardBtn)
    c.pause(500)

    c.waitForElementVisible(coordinatesMapBtn, TIME_LIMIT)
    c.click(coordinatesMapBtn)

    c.click(infoToolbarButton)

    c.waitForElementVisible(settingsInfoItem, TIME_LIMIT)
    c.click(settingsInfoItem)

    c.waitForElementVisible(globalSettingsModal)
    c.pause(500)

    c.expect
      .element(latlondmSettingsButton)
      .to.have.property('className').contains('active')
  },

  'Selecting LATLON-DD in Global Settings changes coordinate format in location marker': (c) => {
    c.url(c.globals.url + locationMarkerQueryString)

    c.click(infoToolbarButton)

    c.waitForElementVisible(settingsInfoItem, TIME_LIMIT)
    c.click(settingsInfoItem)

    c.waitForElementVisible(globalSettingsModal)
    c.pause(500)

    c.click(latlonddSettingsButton)
    c.pause(500)

    c.expect
      .element(tooltipCoordinates)
      .text.to.contain('28.5946°, -81.3507°')
  },

  after: (c) => {
    c.end()
  }
}
