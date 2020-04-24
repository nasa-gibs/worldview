const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const TIME_LIMIT = 5000;

module.exports = {
  before: (client) => {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },

  // verify info toolbar is visible and contains valid menu items
  'Info toolbar is visible and contains valid menu items': (client) => {
    client.expect.element(localSelectors.uiInfoButton).to.be.present;
    client.click(localSelectors.uiInfoButton);

    client.waitForElementVisible('#toolbar_info', TIME_LIMIT);
    client.expect.element('#send_feedback_info_item').to.be.present;
    client.expect.element('#start_tour_info_item').to.be.present;
    client.expect.element('#source_code_info_item').to.be.present;
    client.expect.element('#whats_new_info_item').to.be.present;
    client.expect.element('#about_info_item').to.be.present;
    client.expect.element('#distraction_free_info_item').to.be.present;
  },

  // verify about menu item opens about modal
  'About menu item opens about modal': (client) => {
    client.waitForElementVisible('#toolbar_info', TIME_LIMIT);
    client.waitForElementVisible('#about_info_item', TIME_LIMIT);
    client.click('#about_info_item');
    client.pause(500);

    client.expect.element('.about-page').to.be.present;
    client.expect.element('a[href="mailto:ryan.a.boller@nasa.gov"]').to.be.visible;
  },

  after: (client) => {
    client.end();
  },
};
