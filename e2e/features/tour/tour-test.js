const normalizeViewport = require('../../reuseables/normalize-viewport.js').normalizeViewport;
const TIME_LIMIT = 10000;

module.exports = {
  before: function(client) {
    normalizeViewport(client, 1000, 850);
    client.url(client.globals.url);
  },
  'Verify that the tour is present when the page is loaded': function(client) {
    client.waitForElementVisible('#skipTour', TIME_LIMIT, function() {
      client.click('#takeTour');
      client.waitForElementVisible('.joyride-next-tip', 1000);
    });
  },
  after: function(client) {
    client.end();
  }
};
