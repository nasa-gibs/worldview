const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')
const localQueryStrings = require('../../reuseables/querystrings.js')

const dateSelectorDayInput = '#date-selector-main .input-wrapper-day input'
const TIME_LIMIT = 20000

module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.waitForElementVisible(localSelectors.dragger, TIME_LIMIT)
  },

  // verify timescale dragger is visible
  'Dragger is visible': (c) => {
    c.expect.element(localSelectors.dragger).to.be.visible
  },

  // verify timescale is expanded by default and can be opened/closed
  'Timeline is expanded by default and closes/reopen on clicking timeline chevrons': (c) => {
    c.expect.element('#timeline-footer').to.be.visible
    // hide timeline
    c.click('#timeline-hide')
      .waitForElementNotPresent('#timeline-footer', TIME_LIMIT)
    c.expect.element('#timeline-footer').to.not.be.present

    // expand timeline
    c.click('#timeline-hide')
      .waitForElementVisible('#timeline-footer', TIME_LIMIT)
    c.expect.element('#timeline-footer').to.be.visible
  },

  // verify default MMM YYYY format is displayed on axis
  'verify default MMM YYYY format is displayed on axis': (c) => {
    c.assert.elementPresent('.axis-grid-text-day')
    c.assert.elementPresent('.axis-grid-text-year')
  },

  // verify default 1 day interval
  'Interval defaults to 1 DAY': (c) => {
    c.assert.containsText('#current-interval', '1 DAY')
  },

  // change to month zoom level
  'Change to month zoom level and axis changes': (c) => {
    c.click('.zoom-level-change div.date-arrows.date-arrow-up')
      .pause(500)
    c.assert.elementPresent('.axis-grid-text-month')
    c.assert.elementNotPresent('.axis-grid-text-day')
    c.assert.containsText('#current-zoom', 'MONTH')
  },

  // change to year zoom level
  'Change to year zoom level and axis changes': (c) => {
    c.click('.zoom-level-change div.date-arrows.date-arrow-up')
      .pause(500)
    c.click('.zoom-level-change div.date-arrows.date-arrow-up')
      .pause(500)
    c.assert.elementPresent('.axis-grid-text-year')
    c.assert.elementNotPresent('.axis-grid-text-month')
    c.assert.containsText('#current-zoom', 'YEAR')
  },

  // verify interval state restored from permalink
  'Interval state of HOUR restored from permalink': (c) => {
    c.url(c.globals.url + localQueryStrings.subdailyLayerIntervalTimescale)
    c.moveToElement('#timeline-interval-btn-container', 0, 0)
      .waitForElementVisible('#current-interval', TIME_LIMIT)
    c.assert.containsText('#current-interval', '1 HOUR')
  },

  // verify subdaily default year, month, day, hour, minute, and custom intervals
  'Interval subdaily default year, month, day, hour, minute, and custom available': (c) => {
    c.expect.element('#interval-years').to.be.visible
    c.expect.element('#interval-months').to.be.visible
    c.expect.element('#interval-days').to.be.visible
    c.expect.element('#interval-hours').to.be.visible
    c.expect.element('#interval-minutes').to.be.visible
    c.expect.element('#interval-custom-static').to.be.visible
  },

  // verify custom interval widget panel opens
  'Custom interval widget opens on selecting custom': (c) => {
    c.click('#interval-custom-static')
      .waitForElementVisible('.custom-interval-widget', TIME_LIMIT)
    c.expect.element('.custom-interval-widget').to.be.visible
  },

  // verify changing custom interval changes current interval and how many time units change with date arrows
  'Select custom interval changes current interval and changes date by current interval': (c) => {
    c.url(c.globals.url + localQueryStrings.knownDate)
    c.assert.attributeContains(dateSelectorDayInput, 'value', '22')
    c.moveToElement('#timeline-interval-btn-container', 0, 0)
      .pause(100)
      .click('#interval-custom-static')
      .pause(100)
      .click('.custom-interval-delta-input')
      .setValue('.custom-interval-delta-input', [2, c.Keys.ENTER])
      .moveToElement('#left-arrow-group', 0, 0)
      .click('#left-arrow-group')

    c.assert.containsText('#current-interval', '2 DAY')
    c.assert.attributeContains(dateSelectorDayInput, 'value', '20')
  },

  // verify default day timescale zoom level
  'Timescale zoom level defaults to DAY': (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.assert.containsText('#current-zoom', 'DAY')
  },

  // verify subdaily default year, month, day, hour, minute, and custom intervals
  'Timescale zoom subdaily default year, month, day, hour, minute, and custom intervals': (c) => {
    c.url(c.globals.url + localQueryStrings.subdailyLayerIntervalTimescale)
    c.moveToElement('#current-zoom', 0, 0)
      .waitForElementVisible('#zoom-years', TIME_LIMIT)

    c.expect.element('#zoom-years').to.be.visible
    c.expect.element('#zoom-months').to.be.visible
    c.expect.element('#zoom-days').to.be.visible
    c.expect.element('#zoom-hours').to.be.visible
    c.expect.element('#zoom-minutes').to.be.visible
  },

  // verify timescale zoom state restored from permalink
  'Timescale zoom HOUR restored from permalink': (c) => {
    c.waitForElementVisible('#current-zoom', TIME_LIMIT)
    c.assert.containsText('#current-zoom', 'HOUR')
  },

  // date tooltip date present on load
  'Date tooltip date present load': (c) => {
    c.url(`${c.globals.url}?t=2019-02-22`)
    c.waitForElementVisible('.date-tooltip', TIME_LIMIT)
      .assert.containsText('.date-tooltip', '2019 FEB 22 (DOY 053)')
  },

  // date subdaily tooltip date present on load
  'Date subdaily tooltip date present on load': (c) => {
    c.url(c.globals.url + localQueryStrings.subdailyLayerIntervalTimescale)
    c.waitForElementVisible('.date-tooltip', TIME_LIMIT)
      .assert.containsText('.date-tooltip', '2019 OCT 04 09:46Z (DOY 277)')
  },

  after: (c) => {
    c.end()
  }
}
