const { normalizeViewport } = require('../../reuseables/normalize-viewport.js');

const TIME_LIMIT = 10000;

module.exports = {
  before(client) {
    normalizeViewport(client, 1000, 850);
    client.url(client.globals.url)
      .execute(() => !window.localStorage.getItem('hideTour'));
  },
  'Verify that all tour modals are present when the page is loaded': function(client) {
    let totalSteps;
    client.waitForElementVisible('.tour-start', TIME_LIMIT, () => {
      client.click('.tour-box:first-child');
      client.waitForElementVisible('.tour-in-progress .step-total', 2000, () => {
        client.getText('.tour-in-progress .step-total', (result) => { totalSteps = parseInt(result.value); })
          .perform(() => {
            for (let i = 0; i < totalSteps; i++) {
              client.pause(500);
              client.click('.step-container .step-next');
            }
          }).waitForElementVisible('.tour-complete button.close', 2000, () => {
            client.click('.tour-complete button.close');
          });
      });
    });
  },

  after(client) {
    client.end();
  },
};
