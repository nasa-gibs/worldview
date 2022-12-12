const reuseables = require('../../reuseables/skip-tour.js')
const localQueryStrings = require('../../reuseables/querystrings.js')

const TIME_LIMIT = 10000

const sidebarButton = '#accordion-toggler-button'
const sidebarContent = '#products-holder'
const eventsTab = '#events-sidebar-tab'
const icebergEvent = '#wv-events #sidebar-event-EONET_2703'
const selectedMarker = '.marker.selected'
const trackMarker = '.track-marker'

module.exports = {
  before (c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.setWindowSize(375, 667) // iPhone 6/7/8 dimensions
  },
  'Events populated in sidebar': (c) => {
    c.url(c.globals.url + localQueryStrings.mockEvents)
    c.click(sidebarButton)
    c.waitForElementVisible(sidebarContent, TIME_LIMIT)
    c.click(eventsTab)
    c.waitForElementVisible(icebergEvent, TIME_LIMIT)
  },
  'Clicking event in list closes sidebar and selects marker for event on map': (c) => {
    c.click(icebergEvent)
    c.waitForElementVisible(selectedMarker, TIME_LIMIT)
    c.expect.element(sidebarContent).to.not.be.visible
    c.expect.element(sidebarButton).to.be.present
    c.expect.element(selectedMarker).to.be.present
  },
  'Events load when arriving via permalink': (c) => {
    c.url(c.globals.url + localQueryStrings.stormEventSelected)
    c.waitForElementVisible(selectedMarker, TIME_LIMIT)
    c.expect.element(sidebarContent).to.not.be.visible
    c.expect.element(sidebarButton).to.be.present
    c.expect.element(selectedMarker).to.be.present
    c.expect.element(trackMarker).to.be.present
  },
  after (c) {
    c.end()
  }
}
