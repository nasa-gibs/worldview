const normalizeViewport = require('../../reuseables/normalize-viewport.js').normalizeViewport;
const TIME_LIMIT = 10000;

module.exports = {
  before: function(client) {
    normalizeViewport(client, 1000, 850);
    client.url(client.globals.url)
      .execute(function() {
        return !(window.localStorage.getItem('hideTour'));
      });
  },
  'Verify that all tour modals are present when the page is loaded': function(client) {
    var totalSteps;
    client.waitForElementVisible('.tour-start', TIME_LIMIT, function() {
      client.click('.tour-box:first-child');
      client.waitForElementVisible('.tour-in-progress .step-total', 2000, function() {
        client.getText('.tour-in-progress .step-total', function(result) { totalSteps = parseInt(result.value); })
          .perform(function() {
            for (let i = 0; i < totalSteps; i++) {
              client.pause(500);
              client.click('.step-container .step-next');
            }
          }).waitForElementVisible('.tour-complete button.close', 2000, function() {
            client.click('.tour-complete button.close');
          });
      });
    });
  },

  after: function(client) {
    client.end();
  }
};
