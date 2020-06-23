const reuseables = require('../../reuseables/skip-tour.js');
const localQuerystrings = require('../../reuseables/querystrings.js');

const timelineDataAvailabilityContainer = '.timeline-data-panel-container';
const timelineDataAvailabilityHandle = '#timeline-data-availability-panel-handle';
const timelineDataAvailabilityAxisLine = '.axis-data-coverage-line';
const TIME_LIMIT = 20000;

module.exports = {
  beforeEach: (client) => {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },

  // verify default data coverage is visible on the timeline axis
  'Data coverage is shown by default': (client) => {
    client.waitForElementVisible(timelineDataAvailabilityAxisLine, TIME_LIMIT);
  },

  // verify no data coverage is visible on the timeline axis with just reference layers loaded
  'No data coverage is shown by default': (client) => {
    client.url(client.globals.url + localQuerystrings.referenceLayersOnly);
    client.waitForElementVisible(timelineDataAvailabilityHandle, TIME_LIMIT);
    client.expect.element(timelineDataAvailabilityAxisLine).to.not.be.present;
  },

  // verify panel is hidden and handle is visible on page load
  'Panel is hidden on page load': (client) => {
    client.waitForElementVisible(timelineDataAvailabilityHandle, TIME_LIMIT);
  },

  // verify panel opens on handle click
  'Panel opens on handle click': (client) => {
    client.waitForElementVisible(timelineDataAvailabilityHandle, TIME_LIMIT);
    client
      .click(timelineDataAvailabilityHandle)
      .pause(1000);
    client.expect.element(timelineDataAvailabilityContainer).to.be.visible;
  },

  // verify no hidden layers are visible by default on page load
  'No hidden layers are visible in data panel by default': (client) => {
    client.waitForElementVisible(timelineDataAvailabilityHandle, TIME_LIMIT);
    client
      .click(timelineDataAvailabilityHandle)
      .pause(1000);
    client.expect.element(timelineDataAvailabilityContainer).to.be.visible;
    client.elements('css selector', '.data-panel-layer-list > div', (result) => {
      client.assert.equal(result.value.length, 1);
    });
  },

  after: (client) => {
    client.end();
  },
};
