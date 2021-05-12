const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const {
  infoToolbarButton,
} = localSelectors;

const TIME_LIMIT = 5000;

module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
    c.resizeWindow(375, 667); // iPhone 6/7/8 dimensions
  },

  // verify mobile info toolbar is visible and contains valid mobile menu items
  'Mobile info toolbar is visible and contains valid mobile menu items': (c) => {
    c.expect.element(infoToolbarButton).to.be.present;
    c.pause(500);
    c.click(infoToolbarButton);

    c.waitForElementVisible('#toolbar_info', TIME_LIMIT);
    c.expect.element('#send_feedback_info_item').to.be.present;
    c.expect.element('#source_code_info_item').to.be.present;
    c.expect.element('#whats_new_info_item').to.be.present;
    c.expect.element('#about_info_item').to.be.present;
    c.expect.element('#distraction_free_info_item').to.be.present;
  },

  // verify mobile source code menu item opens separate tab or window
  'Mobile source code menu item opens separate tab or window': (c) => {
    c.windowHandles((tabs) => {
      c.assert.equal(tabs.value.length, 1);
    });

    c.click('#source_code_info_item');
    c.pause(500);

    c.windowHandles((tabs) => {
      c.assert.equal(tabs.value.length, 2);
    });
  },

  after: (c) => {
    c.end();
  },
};
