const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const localQuerystrings = require('../../reuseables/querystrings.js');
const dateSelectorDayInput = '#date-selector-main .input-wrapper-day input';
const TIME_LIMIT = 20000;

module.exports = {
  beforeEach: function(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  // verify timescale dragger is visible
  'Dragger is visible': function(client) {
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
  },
  // verify timescale is expanded and can be opened/closed
  'Timeline is expanded by default and closes/reopen on clicking timeline chevrons': function(client) {
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.expect.element('#timeline-footer').to.be.visible;
    // hide timeline
    client
      .click('#timeline-hide')
      .waitForElementNotVisible('#timeline-footer', TIME_LIMIT);
    client.expect.element('#timeline-footer').to.not.be.visible;
    // expand timeline
    client
      .click('#timeline-hide')
      .waitForElementVisible('#timeline-footer', TIME_LIMIT);
    client.expect.element('#timeline-footer').to.be.visible;
    client.end();
  },
  // verify default 1 day interval
  'Interval defaults to 1 DAY': function(client) {
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.containsText('#current-interval', '1 DAY');
  },
  // verify default year, month, day, and custom intervals
  'Interval default year, month, day, and custom available': function(client) {
    client
      .useCss()
      .moveToElement('#timeline-interval-btn-container', 0, 0)
      .waitForElementVisible('#interval-years', TIME_LIMIT);

    client.expect.element('#interval-years').to.be.visible;
    client.expect.element('#interval-months').to.be.visible;
    client.expect.element('#interval-days').to.be.visible;
    client.expect.element('#interval-custom-static').to.be.visible;
    client.end();
  },
  // verify subdaily default year, month, day, hour, minute, and custom intervals
  // 'Interval subdaily default year, month, day, hour, minute, and custom available': function(client) {
  //   client
  //     .useCss()
  //     .moveToElement('#timeline-interval-btn-container', 0, 0)
  //     .waitForElementVisible('#interval-years', TIME_LIMIT);

  //   client.expect.element('#interval-years').to.be.visible;
  //   client.expect.element('#interval-months').to.be.visible;
  //   client.expect.element('#interval-days').to.be.visible;
  //   client.expect.element('#interval-hours').to.be.visible;
  //   client.expect.element('#interval-minutes').to.be.visible;
  //   client.expect.element('#interval-custom-static').to.be.visible;
  //   client.end();
  // },
  // verify custom interval widget panel opens
  'Custom interval widget opens on selecting custom': function(client) {
    client
      .useCss()
      .moveToElement('#timeline-interval-btn-container', 0, 0)
      .waitForElementVisible('#interval-custom-static', TIME_LIMIT)
      .click('#interval-custom-static')
      .waitForElementVisible('.custom-interval-widget', TIME_LIMIT);

    client.expect.element('.custom-interval-widget').to.be.visible;
    client.end();
  },
  // verify changing custom interval changes current interval and how many time units change with date arrows
  'Select custom interval changes current interval and changes date by current interval': function(client) {
    client.url(client.globals.url + localQuerystrings.knownDate);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.attributeContains(dateSelectorDayInput, 'value', '22');
    client
      .useCss()
      .moveToElement('#timeline-interval-btn-container', 0, 0)
      .pause(100)
      .click('#interval-custom-static')
      .pause(100)
      .click('.custom-interval-delta-input')
      .setValue('.custom-interval-delta-input', [2, client.Keys.ENTER])
      .moveToElement('#left-arrow-group', 0, 0)
      .click('#left-arrow-group');

    client.assert.containsText('#current-interval', '2 DAY');
    client.assert.attributeContains(dateSelectorDayInput, 'value', '20');
  },
  // verify default day timescale zoom level
  'Timescale zoom level defaults to DAY': function(client) {
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.containsText('#current-zoom', 'DAY');
  },
  // verify default year, month, day, and custom intervals
  'Timescale zoom default year, month, day, and custom available': function(client) {
    client
      .useCss()
      .moveToElement('#zoom-btn-container-axis', 0, 0)
      .waitForElementVisible('#zoom-years', TIME_LIMIT);

    client.expect.element('#zoom-years').to.be.visible;
    client.expect.element('#zoom-months').to.be.visible;
    client.expect.element('#zoom-days').to.be.visible;
    client.end();
  },
  // verify subdaily default year, month, day, hour, minute, and custom intervals
  // 'Interval subdaily default year, month, day, hour, minute, and custom available': function(client) {
  // client
  //   .useCss()
  //   .moveToElement('#current-zoom', 0, 0)
  //   .waitForElementVisible('#zoom-years', TIME_LIMIT);

  //   client.expect.element('#zoom-years').to.be.visible;
  //   client.expect.element('#zoom-months').to.be.visible;
  //   client.expect.element('#zoom-days').to.be.visible;
  //   client.expect.element('#zoom-hours').to.be.visible;
  //   client.expect.element('#zoom-minutes').to.be.visible;
  //   client.end();
  // },

  // verify change date using left/right date arrows
  'Change date using left/right arrows': function(client) {
    client.url(client.globals.url + localQuerystrings.knownDate);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.attributeContains(dateSelectorDayInput, 'value', '22');
    client.click('#left-arrow-group');
    client.assert.attributeContains(dateSelectorDayInput, 'value', '21');
    client.click('#right-arrow-group');
    client.assert.attributeContains(dateSelectorDayInput, 'value', '22');
  },
  // verify default left arrow enabled since loaded on current day
  'Left timeline arrow will not be disabled': function(client) {
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.cssClassNotPresent('#left-arrow-group', 'button-disabled');
  },
  // verify default right arrow disabled since loaded on current day
  'Right timeline arrow will be disabled': function(client) {
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.cssClassPresent('#right-arrow-group', 'button-disabled');
  },
  // verify valid right arrow enabled since NOT loaded on current day
  'Right timeline arrow will not be disabled': function(client) {
    client.url(client.globals.url + localQuerystrings.knownDate);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.cssClassNotPresent('#right-arrow-group', 'button-disabled');
  },
  after: function(client) {
    client.end();
  }
};
