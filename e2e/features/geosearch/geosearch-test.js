const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

// encoded id; originally coordinates-map-marker_38.8904,-77.032
const testMarkerEncodedID = '.coordinates-map-marker_38__2E__8904__2C__-77__2E__032';
const testMarkerNoDetailsEncodedID = '.coordinates-map-marker_5__2C__-51__2E__5';
const TIME_LIMIT = 10000;

const {
  geosearchToolbarButton,
  geosearchComponent,
  geosearchMinimizeButton,
  tooltipCoordinatesContainer,
  tooltipCoordinatesTitle,
  tooltipCoordinates,
  tooltipCoordinatesMinimizeButton,
  tooltipCoordinatesCloseButton,
  coordinatesMapMarker,
} = localSelectors;

module.exports = {
  before(c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
  },
  'Geosearch component is visible by default': (c) => {
    c.waitForElementVisible(geosearchComponent, TIME_LIMIT);
    c.expect.element(geosearchComponent).to.be.present;
  },
  'Clicking the minimize button minimizes the geosearch component': (c) => {
    c.waitForElementVisible(geosearchComponent, TIME_LIMIT);
    c.click(geosearchMinimizeButton);
    c.pause(500);
    c.expect.element(geosearchComponent).to.not.be.present;
  },
  'Geosearch component remains hidden on subsequent page loads per user preference': (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
    c.waitForElementVisible(geosearchToolbarButton, TIME_LIMIT);
    c.expect.element(geosearchComponent).to.not.be.present;
  },
  'Clicking geosearch toolbar button expands the geosearch component': (c) => {
    c.click(geosearchToolbarButton);
    c.pause(500);
    c.expect.element(geosearchComponent).to.be.present;
  },
  'Coordinates dialog for permalink marker is visible by default on page load': (c) => {
    c.url(`${c.globals.url}?v=-176.3167432493038,-16.70650759975561,-16.988618249303812,108.30938074294103&gm=-77.032,38.8904`);
    c.waitForElementVisible(tooltipCoordinatesContainer, TIME_LIMIT);
    c.expect.element(testMarkerEncodedID).to.be.present;
  },
  'Coordinates title and detailed coordinates are correct': (c) => {
    c.assert.containsText(tooltipCoordinatesTitle, 'Washington, District of Columbia');
    c.assert.containsText(tooltipCoordinates, '38.8904°, -77.0320°');
  },
  'Clicking minimize tooltip hides the coordinates dialog': (c) => {
    c.click(tooltipCoordinatesMinimizeButton);
    c.pause(500);
    c.expect.element(tooltipCoordinatesContainer).to.not.be.present;
  },
  'Coordinate title for no suggested place results displays correct coordinates instead': (c) => {
    c.url(`${c.globals.url}?gm=-51.5,5`);
    c.waitForElementVisible(tooltipCoordinatesContainer, TIME_LIMIT);
    c.expect.element(testMarkerNoDetailsEncodedID).to.be.present;
    c.assert.containsText(tooltipCoordinatesTitle, '5.0000°, -51.5000°');
    c.assert.containsText(tooltipCoordinates, '5.0000°, -51.5000°');
  },
  'Clicking close tooltip removes the marker and coordinates dialog': (c) => {
    c.click(tooltipCoordinatesCloseButton);
    c.pause(500);
    c.expect.element(coordinatesMapMarker).to.not.be.present;
    c.assert.not.urlContains('marker');
  },
  'Invalid marker query string parameter prevents state update': (c) => {
    c.url(`${c.globals.url}?gm=-51.5,invalidtext`);
    c.expect.element(coordinatesMapMarker).to.not.be.present;
    c.assert.not.urlContains('marker');
  },
  after(c) {
    c.end();
  },
};
