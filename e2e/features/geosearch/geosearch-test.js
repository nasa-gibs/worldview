const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const TIME_LIMIT = 10000;

const {
  geosearchToolbarButton,
  geosearchComponent,
  geosearchMinimizeButton,
} = localSelectors;

module.exports = {
  before(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Geosearch component is visible by default': (client) => {
    client.waitForElementVisible(geosearchComponent, TIME_LIMIT);
    client.expect.element(geosearchComponent).to.be.present;
  },
  'Clicking the minimize button minimizes the geosearch component': (client) => {
    client.waitForElementVisible(geosearchComponent, TIME_LIMIT);
    client.click(geosearchMinimizeButton);
    client.pause(500);
    client.expect.element(geosearchComponent).to.not.be.present;
  },
  'Clicking geosearch toolbar button expands the geosearch component': (client) => {
    client.waitForElementVisible(geosearchToolbarButton, TIME_LIMIT);
    client.click(geosearchToolbarButton);
    client.pause(500);
    client.expect.element(geosearchComponent).to.be.present;
  },
  after(client) {
    client.end();
  },
};
