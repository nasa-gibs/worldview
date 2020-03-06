const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const localQuerystrings = require('../../reuseables/querystrings.js');

const TIME_LIMIT = 10000;
module.exports = {
  before(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  /**
   * Clicking the animation widget button
   * Opens the widget
   */
  'Toggling Animation Mode': function(client) {
    client.expect.element(localSelectors.animationWidget).to.not.be.present;
    client.useCss().click(localSelectors.animationButton);
    client.waitForElementVisible(localSelectors.animationWidget, TIME_LIMIT);
  },
  'Opening custom interval widget': function(client) {
    client.url(client.globals.url + localQuerystrings.activeAnimationWidget);
    client.waitForElementVisible(
      localSelectors.animationButton,
      TIME_LIMIT,
      (el) => {
        client
          .useCss()
          .moveToElement('.wv-animation-widget-header #timeline-interval-btn-container #current-interval', 1, 1)
          .waitForElementVisible('.wv-animation-widget-header .timeline-interval .interval-years', 2000)
          .click('.wv-animation-widget-header .timeline-interval #interval-custom-static');
        client.pause(1000);
        client.useCss().assert.elementPresent('#wv-animation-widget .custom-interval-widget');
        client.useCss().assert.containsText('.wv-animation-widget-header #current-interval', '1 DAY');
        client.useCss().assert.containsText('#timeline #current-interval', '1 DAY');
      },
    );
  },
  /**
   * Moving the range selector updates the selected range
   * in the animation widget date selector
   */
  'Changing date range of animation': function(client) {
    client.url(client.globals.url + localQuerystrings.activeAnimationWidget);
    // Test Permalink opens widget
    client.waitForElementVisible(
      '#day-animation-widget-start',
      TIME_LIMIT,
      (el) => {
        client.getValue('#day-animation-widget-start', (result) => {
          const startDay = result.value;
          client
            .useCss()
            .moveToElement(
              '#wv-timeline-range-selector > g:nth-child(2) > rect',
              1,
              1,
            )
            .mouseButtonDown(0)
            .moveToElement('.timeline-dragger', 0, 0)
            .mouseButtonUp(0)
            .pause(2000);
          client.getValue('#day-animation-widget-start', function(result) {
            const newDay = result.value;
            this.assert.notEqual(startDay, newDay);
          });
        });
      },
    );
  },

  /**
   * Changing animation time interval
   */
  'Changing animation time interval': function(client) {
    // Can't use moveToElement twice with same elements
    // because of selenium catching.
    // Loading a different Url fixed the problem
    // https://github.com/SeleniumHQ/selenium/issues/4724#issuecomment-330862710
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
    client.useCss().click(localSelectors.animationButton);
    client.waitForElementVisible(
      localSelectors.animationButton,
      TIME_LIMIT,
      (el) => {
        client
          .useCss()
          .moveToElement('.wv-animation-widget-header #timeline-interval-btn-container #current-interval', 1, 1)
          .waitForElementVisible('.wv-animation-widget-header .timeline-interval .interval-years', 2000)
          .click('.wv-animation-widget-header #timeline-interval #interval-years');
        client.pause(1000);
        client.useCss().assert.containsText('.wv-animation-widget-header #current-interval', '1 YEAR');
        client.useCss().assert.containsText('#timeline #current-interval', '1 YEAR');
      },
    );
  },
  after(client) {
    client.end();
  },
};
