const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const localQuerystrings = require('../../reuseables/querystrings.js');
const TIME_LIMIT = 10000;
module.exports = {
  before: function (client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  /**
   * Clicking the animation widget button
   * Opens the widget
   */
  'Toggling Animation Mode': function(client) {
    client.expect.element(localSelectors.animationWidget).to.not.be.visible;
    client.useCss().click(localSelectors.animationButton);
    client.waitForElementVisible(localSelectors.animationWidget, TIME_LIMIT);
  },
  /**
   * Moving the range selector updates the selected range
   * in the animation widget date selector
   */
  'Changing date range of animation': function(client) {
    client.url(client.globals.url + localQuerystrings.activeAnimationWidget);
    // Test Permalink opens widget
    client.waitForElementVisible('#day-animation-widget-start', TIME_LIMIT, function(el) {
      client.getValue('#day-animation-widget-start', function(result) {
        const startDay = result.value;
        client.useCss()
          .moveToElement('#wv-timeline-range-selector > g:nth-child(2) > rect', 1, 1)
          .mouseButtonDown(0)
          .moveToElement('#guitarpick', 0, 0)
          .mouseButtonUp(0)
          .pause(2000);
        client.getValue('#day-animation-widget-start', function(result) {
          const newDay = result.value;
          this.assert.notEqual(startDay, newDay);
        });
      });
    });
  },
  /**
   * Changing the resolution to a selection with too high of a resolution
   * disables downloading the GIF
   */
  'Changing animation time resolution': function(client) {
    const globalSelectors = client.globals.selectors;
    client.url(client.globals.url + localQuerystrings.activeAnimationWidget);
    client.waitForElementVisible(localSelectors.animationButton, TIME_LIMIT, function(el) {
      client.useCss()
        .moveToElement(globalSelectors.resolutionTooltip, 1, 1)
        .click(globalSelectors.yearlyResolutionTooltip);
      client.pause(1000);
      client.expect.element(globalSelectors.timelineSetToYears).to.be.present;
    });
  },
  after: function(client) {
    client.end();
  }
};
