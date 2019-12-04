const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const localQuerystrings = require('../../reuseables/querystrings.js');
const dateSelectorDayInput = '#date-selector-main .input-wrapper-day input';
const dateSelectorMonthInput = '#date-selector-main .input-wrapper-month input';
const dateSelectorYearInput = '#date-selector-main .input-wrapper-year input';
const TIME_LIMIT = 20000;

module.exports = {
  beforeEach: client => {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },

  // verify timescale dragger is visible
  'Dragger is visible': client => {
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
  },

  // verify timescale is expanded and can be opened/closed
  'Timeline is expanded by default and closes/reopen on clicking timeline chevrons': client => {
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
  'Interval defaults to 1 DAY': client => {
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.containsText('#current-interval', '1 DAY');
  },

  // verify subdaily default year, month, day, hour, minute, and custom intervals
  'Interval subdaily default year, month, day, hour, minute, and custom available': client => {
    client.url(client.globals.url + localQuerystrings.subdailyLayerIntervalTimescale);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client
      .useCss()
      .moveToElement('#timeline-interval-btn-container', 0, 0)
      .waitForElementVisible('#interval-years', TIME_LIMIT);

    client.expect.element('#interval-years').to.be.visible;
    client.expect.element('#interval-months').to.be.visible;
    client.expect.element('#interval-days').to.be.visible;
    client.expect.element('#interval-hours').to.be.visible;
    client.expect.element('#interval-minutes').to.be.visible;
    client.expect.element('#interval-custom-static').to.be.visible;
    client.end();
  },

  // verify interval state restored from permalink
  'Interval state of HOUR restored from permalink': client => {
    client.url(client.globals.url + localQuerystrings.subdailyLayerIntervalTimescale);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client
      .useCss()
      .moveToElement('#timeline-interval-btn-container', 0, 0)
      .waitForElementVisible('#current-interval', TIME_LIMIT);
    client.assert.containsText('#current-interval', '1 HOUR');
  },

  // verify custom interval widget panel opens
  'Custom interval widget opens on selecting custom': client => {
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
  'Select custom interval changes current interval and changes date by current interval': client => {
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
  'Timescale zoom level defaults to DAY': client => {
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.containsText('#current-zoom', 'DAY');
  },

  // verify subdaily default year, month, day, hour, minute, and custom intervals
  'Timescale zoom subdaily default year, month, day, hour, minute, and custom intervals': client => {
    client.url(client.globals.url + localQuerystrings.subdailyLayerIntervalTimescale);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client
      .useCss()
      .moveToElement('#current-zoom', 0, 0)
      .waitForElementVisible('#zoom-years', TIME_LIMIT);

    client.expect.element('#zoom-years').to.be.visible;
    client.expect.element('#zoom-months').to.be.visible;
    client.expect.element('#zoom-days').to.be.visible;
    client.expect.element('#zoom-hours').to.be.visible;
    client.expect.element('#zoom-minutes').to.be.visible;
    client.end();
  },

  // verify timescale zoom state restored from permalink
  'Timescale zoom HOUR restored from permalink': client => {
    client.url(client.globals.url + localQuerystrings.subdailyLayerIntervalTimescale);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client
      .useCss()
      .waitForElementVisible('#current-zoom', TIME_LIMIT);
    client.assert.containsText('#current-zoom', 'HOUR');
    client.end();
  },

  // verify change date using left/right date arrows
  'Change date using left/right arrows': client => {
    client.url(client.globals.url + localQuerystrings.knownDate);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.attributeContains(dateSelectorDayInput, 'value', '22');
    client.click('#left-arrow-group');
    client.assert.attributeContains(dateSelectorDayInput, 'value', '21');
    client.click('#right-arrow-group');
    client.assert.attributeContains(dateSelectorDayInput, 'value', '22');
  },

  // verify default left arrow enabled since loaded on current day
  'Left timeline arrow will not be disabled': client => {
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.cssClassNotPresent('#left-arrow-group', 'button-disabled');
  },

  // verify default right arrow disabled since loaded on current day
  'Right timeline arrow will be disabled': client => {
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.cssClassPresent('#right-arrow-group', 'button-disabled');
  },

  // verify valid right arrow enabled since NOT loaded on current day
  'Right timeline arrow will not be disabled': client => {
    client.url(client.globals.url + localQuerystrings.knownDate);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.assert.cssClassNotPresent('#right-arrow-group', 'button-disabled');
  },

  // verify user can temporarily input incorrect day values in date selector
  'Allow invalid day values in date selector': client => {
    client.url(client.globals.url + '?t=2019-02-22');
    client
      .click(dateSelectorDayInput)
      .setValue(dateSelectorDayInput, [31, client.Keys.ENTER]);
    client.assert.cssClassPresent(dateSelectorDayInput, 'invalid-input');
  },

  // verify user can change year on invalid date to a valid one and remove invalid-input class
  'Allow invalid year to valid year values in date selector': client => {
    client.url(client.globals.url + '?t=2019-02-22');
    client
      .click(dateSelectorYearInput)
      .setValue(dateSelectorYearInput, [2020, client.Keys.ENTER]);
    client.setValue(dateSelectorMonthInput, ['MAR', client.Keys.ENTER]);
    client.setValue(dateSelectorDayInput, [31, client.Keys.ENTER]);
    client.setValue(dateSelectorYearInput, [2019, client.Keys.ENTER]);
    client.assert.cssClassNotPresent(dateSelectorYearInput, 'invalid-input');
  },

  after: client => {
    client.end();
  }
};
