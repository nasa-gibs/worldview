const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const TIME_LIMIT = 10000;

const {
  geosearchToolbarButton,
  geosearchMobileDialog,
} = localSelectors;

module.exports = {
  before(c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
    c.resizeWindow(375, 667); // iPhone 6/7/8 dimensions
    c.pause(300);
  },
  'Geosearch mobile dialog is not visible by default': (c) => {
    c.waitForElementVisible(geosearchToolbarButton, TIME_LIMIT);
    c.expect.element(geosearchMobileDialog).to.not.be.present;
  },
  'Clicking geosearch toolbar button opens the geosearch mobile dialog': (c) => {
    c.waitForElementVisible(geosearchToolbarButton, TIME_LIMIT);
    c.click(geosearchToolbarButton);
    c.pause(500);
    c.expect.element(geosearchMobileDialog).to.be.present;
  },
  after(c) {
    c.end();
  },
};
