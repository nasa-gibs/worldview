const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')

// encoded id; originally coordinates-map-marker_38.8904,-77.032
const testMarkerEncodedID = '.coordinates-map-marker_-77__2E__032__2C__38__2E__8904'
const TIME_LIMIT = 10000

const {
  locationSearchToolbarButton,
  locationSearchComponent,
  locationSearchMinimizeButton,
  tooltipCoordinatesContainer,
  tooltipCoordinatesTitle,
  tooltipCoordinates,
  tooltipCoordinatesMinimizeButton,
  tooltipCoordinatesCloseButton,
  coordinatesMapMarker
} = localSelectors

module.exports = {
  before (c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },
  'Location Search component is visible by default': (c) => {
    c.waitForElementVisible(locationSearchComponent, TIME_LIMIT)
    c.expect.element(locationSearchComponent).to.be.present
  },
  'Clicking the minimize button minimizes the Location Search component': (c) => {
    c.waitForElementVisible(locationSearchComponent, TIME_LIMIT)
    c.click(locationSearchMinimizeButton)
    c.pause(500)
    c.expect.element(locationSearchComponent).to.not.be.present
  },
  'Location Search component remains hidden on subsequent page loads per user preference': (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.waitForElementVisible(locationSearchToolbarButton, TIME_LIMIT)
    c.expect.element(locationSearchComponent).to.not.be.present
  },
  'Clicking Location Search toolbar button expands the Location Search component': (c) => {
    c.click(locationSearchToolbarButton)
    c.pause(500)
    c.expect.element(locationSearchComponent).to.be.present
  },
  'Coordinates dialog for permalink marker is visible by default on page load': (c) => {
    c.url(`${c.globals.url}?v=-176.3167432493038,-16.70650759975561,-16.988618249303812,108.30938074294103&s=-77.032,38.8904`)
    c.waitForElementVisible(tooltipCoordinatesContainer, TIME_LIMIT)
    c.expect.element(testMarkerEncodedID).to.be.present
  },
  'Coordinates title and detailed coordinates are correct': (c) => {
    c.assert.containsText(tooltipCoordinatesTitle, 'Washington, District of Columbia')
    c.assert.containsText(tooltipCoordinates, '38.8904°, -77.0320°')
  },
  'Clicking minimize tooltip hides the coordinates dialog': (c) => {
    c.click(tooltipCoordinatesMinimizeButton)
    c.pause(500)
    c.expect.element(tooltipCoordinatesContainer).to.not.be.present
  },
  'Clicking close tooltip removes the marker and coordinates dialog': (c) => {
    c.url(`${c.globals.url}?v=-39.980778604772254,-93.78047406661956,48.73858468999798,-50.229432449264905&s=10,-75`)
    c.waitForElementVisible(tooltipCoordinatesContainer, TIME_LIMIT)
    c.click(tooltipCoordinatesCloseButton)
    c.pause(500)
    c.expect.element(coordinatesMapMarker).to.not.be.present
    c.assert.not.urlContains('s=')
  },
  'Invalid marker query string parameter prevents state update': (c) => {
    c.url(`${c.globals.url}?s=-51.5,invalidtext`)
    c.expect.element(coordinatesMapMarker).to.not.be.present
    c.assert.not.urlContains('s=')
  },
  after (c) {
    c.end()
  }
}
