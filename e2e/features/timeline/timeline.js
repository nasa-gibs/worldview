const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const TIME_LIMIT = 20000;

module.exports = {
  before: function(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  // verify timescale dragger is visible
  'Dragger is visible': function(client) {
    client.url(client.globals.url);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
  },
  // verify default 1 day interval
  'Interval defaults to 1 DAY': function(client) {
    client.url(client.globals.url);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.containsText('#current-interval', '1 DAY');
  },
  // verify default day timescale zoom level
  'Timescale zoom level defaults to DAY': function(client) {
    client.url(client.globals.url);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.containsText('#current-zoom', 'DAY');
  },
  // verify default left arrow enabled since loaded on current day
  'Left timeline arrow will not be disabled': function(client) {
    client.url(client.globals.url);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.cssClassNotPresent('#left-arrow-group', 'button-disabled');
  },
  // verify default right arrow disabled since loaded on current day
  'Right timeline arrow will be disabled': function(client) {
    client.url(client.globals.url);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.cssClassPresent('#right-arrow-group', 'button-disabled');
  },
  after: function(client) {
    client.end();
  }
};
