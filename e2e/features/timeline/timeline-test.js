const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const localQuerystrings = require('../../reuseables/querystrings.js');
const draggerA = '.timeline-dragger.draggerA ';
const dateSelectorDayInput = '#date-selector-main .input-wrapper-day input';
const TIME_LIMIT = 20000;

module.exports = {
  beforeEach: client => {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
  },

  // verify timescale dragger is visible
  'Dragger is visible': client => {
    client.expect.element(localSelectors.dragger).to.be.visible;
  },

  // verify timescale is expanded by default and can be opened/closed
  'Timeline is expanded by default and closes/reopen on clicking timeline chevrons': client => {
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

  // verify default MMM YYYY format is displayed on axis
  'verify default MMM YYYY format is displayed on axis': client => {
    client.assert.elementPresent('.axis-grid-text-day');
    client.assert.elementPresent('.axis-grid-text-year');
  },

  // verify default 1 day interval
  'Interval defaults to 1 DAY': client => {
    client.assert.containsText('#current-interval', '1 DAY');
  },

  // change to month zoom level
  'Change to month zoom level and axis changes': client => {
    client
      .click('.zoom-level-change div.date-arrows.date-arrow-up')
      .pause(500);
    client.assert.elementPresent('.axis-grid-text-month');
    client.assert.elementNotPresent('.axis-grid-text-day');
    client.assert.containsText('#current-zoom', 'MONTH');
  },

  // change to year zoom level
  'Change to year zoom level and axis changes': client => {
    client
      .click('.zoom-level-change div.date-arrows.date-arrow-up')
      .pause(500);
    client
      .click('.zoom-level-change div.date-arrows.date-arrow-up')
      .pause(500);
    client.assert.elementPresent('.axis-grid-text-year');
    client.assert.elementNotPresent('.axis-grid-text-month');
    client.assert.containsText('#current-zoom', 'YEAR');
  },

  // verify subdaily default year, month, day, hour, minute, and custom intervals
  'Interval subdaily default year, month, day, hour, minute, and custom available': client => {
    client.url(client.globals.url + localQuerystrings.subdailyLayerIntervalTimescale);
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
    client.assert.containsText('#current-zoom', 'DAY');
  },

  // verify subdaily default year, month, day, hour, minute, and custom intervals
  'Timescale zoom subdaily default year, month, day, hour, minute, and custom intervals': client => {
    client.url(client.globals.url + localQuerystrings.subdailyLayerIntervalTimescale);
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
    client
      .useCss()
      .waitForElementVisible('#current-zoom', TIME_LIMIT);
    client.assert.containsText('#current-zoom', 'HOUR');
    client.end();
  },

  // blue hover line and valid date tooltip date are present on hovering over timeline axis
  'Blue hover line is present on hovering over timeline axis': client => {
    client.url(client.globals.url + '?t=2019-02-22');
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client
      .useCss()
      .moveToElement(draggerA, 15, 15)
      .mouseButtonDown(0)
      .waitForElementVisible('.date-tooltip', TIME_LIMIT)
      .assert.containsText('.date-tooltip', '2019-02-22 (53)')
      .mouseButtonUp(0)
      .moveTo(null, -200, 0);

    client.waitForElementVisible('.axis-hover-line-container', TIME_LIMIT);
    client.expect.element('.axis-hover-line-container').to.be.visible;
    client.expect.element('.date-tooltip').to.be.visible;
  },

  // subdaily valid date tooltip date is present on hovering over timeline axis
  'Subdaily date tooltip date is present on hovering over timeline axis': client => {
    client.url(client.globals.url + localQuerystrings.subdailyLayerIntervalTimescale);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client
      .useCss()
      .moveToElement(draggerA, 15, 15)
      .mouseButtonDown(0)
      .waitForElementVisible('.date-tooltip', TIME_LIMIT)
      .assert.containsText('.date-tooltip', '2019-10-04 09:46Z (277)');
  },

  after: client => {
    client.end();
  }
};
