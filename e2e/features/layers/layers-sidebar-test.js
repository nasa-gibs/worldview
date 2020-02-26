const skipTour = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const TIME_LIMIT = 10000;

module.exports = {
  before: (client) => {
    skipTour.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Toggle layer Info': (client) => {
    client.click(localSelectors.infoButton);
    client.waitForElementVisible(localSelectors.infoDialog, 1000, (e) => {
      client.click(localSelectors.infoButton).pause(100);
      client.expect.element(localSelectors.infoDialog).to.not.be.present;
      client.click(localSelectors.infoButton).pause(1000);
      client.expect.element(localSelectors.infoDialog).to.be.present;
    });
  },
  'Toggle Layer Options': (client) => {
    client.click(localSelectors.optionsButton);
    client.waitForElementVisible(localSelectors.optionsDialog, 1000, (e) => {
      client.click(localSelectors.optionsButton).pause(100);
      client.expect.element(localSelectors.optionsDialog).to.not.be.present;
      client.click(localSelectors.optionsButton).pause(1000);
      client.expect.element(localSelectors.optionsDialog).to.be.present;
    });
  },
  // TODO tests for orbit tracks toggle on/off
  after: (client) => {
    client.end();
  }
};
