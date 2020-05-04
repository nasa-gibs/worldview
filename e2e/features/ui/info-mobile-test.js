const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const TIME_LIMIT = 5000;

module.exports = {
  beforeEach: (client) => {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
    client.resizeWindow(375, 667); // iPhone 6/7/8 dimensions
  },

  // verify mobile info toolbar is visible and contains valid mobile menu items
  'Mobile info toolbar is visible and contains valid mobile menu items': (client) => {
    client.expect.element(localSelectors.uiInfoButton).to.be.present;
    client.pause(500);
    client.click(localSelectors.uiInfoButton);

    client.waitForElementVisible('#toolbar_info', TIME_LIMIT);
    client.expect.element('#send_feedback_info_item').to.be.present;
    client.expect.element('#source_code_info_item').to.be.present;
    client.expect.element('#whats_new_info_item').to.be.present;
    client.expect.element('#about_info_item').to.be.present;
  },

  // verify mobile source code menu item opens separate tab or window
  'Mobile source code menu item opens separate tab or window': (client) => {
    client.pause(1000);
    client.waitForElementVisible(localSelectors.uiInfoButton, TIME_LIMIT);
    client.click(localSelectors.uiInfoButton);
    client.waitForElementVisible('#toolbar_info', TIME_LIMIT);

    client.windowHandles((tabs) => {
      client.assert.equal(tabs.value.length, 1);
    });

    client.waitForElementVisible('#source_code_info_item', TIME_LIMIT);
    client.click('#source_code_info_item');
    client.pause(1000);

    client.windowHandles((tabs) => {
      client.assert.equal(tabs.value.length, 2);
    });
  },

  afterEach: (client) => {
    client.end();
  },
};
