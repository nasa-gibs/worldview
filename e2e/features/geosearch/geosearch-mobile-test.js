const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const TIME_LIMIT = 10000;

const {
  geosearchToolbarButton,
  geosearchMobileDialog,
} = localSelectors;

module.exports = {
  before(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
    client.resizeWindow(375, 667); // iPhone 6/7/8 dimensions
    client.pause(300);
  },
  'Geosearch mobile dialog is not visible by default': (client) => {
    client.waitForElementVisible(geosearchToolbarButton, TIME_LIMIT);
    client.expect.element(geosearchMobileDialog).to.not.be.present;
  },
  'Clicking geosearch toolbar button opens the geosearch mobile dialog': (client) => {
    client.waitForElementVisible(geosearchToolbarButton, TIME_LIMIT);
    client.click(geosearchToolbarButton);
    client.pause(500);
    client.expect.element(geosearchMobileDialog).to.be.present;
  },
  after(client) {
    client.end();
  },
};
