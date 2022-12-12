const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')
const localQueryStrings = require('../../reuseables/querystrings.js')

const {
  dayUp,
  dayDown,
  dragger
} = localSelectors

const {
  knownDate,
  subdailyLayerIntervalTimescale
} = localQueryStrings

const dateSelectorMinuteInput = '#date-selector-main .input-wrapper-minute input'
const dateSelectorHourInput = '#date-selector-main .input-wrapper-hour input'
const dateSelectorDayInput = '#date-selector-main .input-wrapper-day input'
const dateSelectorMonthInput = '#date-selector-main .input-wrapper-month input'
const dateSelectorYearInput = '#date-selector-main .input-wrapper-year input'
const TIME_LIMIT = 20000

module.exports = {
  beforeEach: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.waitForElementVisible(dragger, TIME_LIMIT)
  },

  // verify subdaily default year, month, day, hour, minute date selector inputs
  'Verify subdaily default year, month, day, hour, minute date selector inputs': (c) => {
    c.url(c.globals.url + subdailyLayerIntervalTimescale)
    c.waitForElementVisible(dragger, TIME_LIMIT)
    c.expect.element(dateSelectorMinuteInput).to.be.visible
    c.expect.element(dateSelectorHourInput).to.be.visible
    c.expect.element(dateSelectorDayInput).to.be.visible
    c.expect.element(dateSelectorMonthInput).to.be.visible
    c.expect.element(dateSelectorYearInput).to.be.visible
    c.end()
  },

  // verify change date using left/right date arrows
  'Change date using left/right arrows': (c) => {
    c.url(c.globals.url + knownDate)
    c.assert.attributeContains(dateSelectorDayInput, 'value', '22')
    c.click('#left-arrow-group')
    c.assert.attributeContains(dateSelectorDayInput, 'value', '21')
    c.click('#right-arrow-group')
    c.assert.attributeContains(dateSelectorDayInput, 'value', '22')
  },

  // verify default left arrow enabled since loaded on current day
  'Left timeline arrow will not be disabled by default': (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.assert.not.cssClassPresent('#left-arrow-group', 'button-disabled')
  },

  // verify default right arrow disabled since loaded on current day
  'Right timeline arrow will be disabled by default': (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.assert.cssClassPresent('#right-arrow-group', 'button-disabled')
  },

  // verify default now button disabled
  'Now button will be disabled by default': (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.assert.cssClassPresent('#now-button-group', 'button-disabled')
  },

  // verify valid right arrow enabled since NOT loaded on current day
  'Right timeline arrow will not be disabled': (c) => {
    c.url(c.globals.url + knownDate)
    c.assert.not.cssClassPresent('#right-arrow-group', 'button-disabled')
  },

  // verify now button enabled since NOT loaded on current day
  'Now button will not be disabled if date is not on now': (c) => {
    c.url(c.globals.url + knownDate)
    c.assert.not.cssClassPresent('#now-button-group', 'button-disabled')
  },

  // verify date selector is populated with date YYYY-MON-DD
  'Verify date selector is populated with date YYYY-MON-DD': (c) => {
    c.url(`${c.globals.url}?t=2019-02-22`)
    c.assert.attributeContains(dateSelectorDayInput, 'value', '22')
    c.assert.attributeContains(dateSelectorMonthInput, 'value', 'FEB')
    c.assert.attributeContains(dateSelectorYearInput, 'value', '2019')
  },

  // verify subdaily date selector is populated with date YYYY-MON-DD-HH-MM
  'Verify subdaily date selector is populated with date YYYY-MON-DD-HH-MM': (c) => {
    c.url(c.globals.url + subdailyLayerIntervalTimescale)

    c.assert.attributeContains(dateSelectorMinuteInput, 'value', '46')
    c.assert.attributeContains(dateSelectorHourInput, 'value', '09')
    c.assert.attributeContains(dateSelectorDayInput, 'value', '04')
    c.assert.attributeContains(dateSelectorMonthInput, 'value', 'OCT')
    c.assert.attributeContains(dateSelectorYearInput, 'value', '2019')
  },

  // verify user can temporarily input incorrect day values in date selector
  'Allow invalid day values in date selector': (c) => {
    c.url(`${c.globals.url}?t=2019-02-22`)
    c
      .click(dateSelectorDayInput)
      .sendKeys(dateSelectorDayInput, [31, c.Keys.ENTER])
      .pause(500)
    c.assert.hasClass(dateSelectorDayInput, 'invalid-input')
  },

  // verify user can change year on invalid date to a valid one and remove invalid-input class
  'Allow invalid year to valid year values in date selector': (c) => {
    c.url(`${c.globals.url}?t=2019-02-22`)
    c
      .click(dateSelectorYearInput)
      .sendKeys(dateSelectorYearInput, 2020)
    c.sendKeys(dateSelectorMonthInput, 'MAR')
    c.sendKeys(dateSelectorDayInput, 31)
    c.sendKeys(dateSelectorYearInput, 2019)
    c.assert.not.cssClassPresent(dateSelectorDayInput, 'invalid-input')
    c.assert.not.cssClassPresent(dateSelectorMonthInput, 'invalid-input')
    c.assert.not.cssClassPresent(dateSelectorYearInput, 'invalid-input')
  },

  // verify invalid permalink date rolls over to valid date YYYY-MON-DD (e.g., 2013-02-29 becomes 2013-03-01)
  'Verify invalid days are rolled over': (c) => {
    c.url(`${c.globals.url}?t=2013-02-29`)
    c.assert.attributeContains(dateSelectorDayInput, 'value', '01')
    c.assert.attributeContains(dateSelectorMonthInput, 'value', 'MAR')
    c.assert.attributeContains(dateSelectorYearInput, 'value', '2013')
  },

  // date selector up arrow rolls over from Feb 28 to 1 (non leap year) and the inverse
  'Date selector up arrow rolls over from Feb 28 to 1 (non leap year) and the inverse': (c) => {
    c.url(`${c.globals.url}?t=2013-02-28`)
    c.waitForElementVisible(dragger, TIME_LIMIT)
    c.click(dayUp).pause(500)

    c.assert.attributeContains(dateSelectorDayInput, 'value', '01')
    c.assert.attributeContains(dateSelectorMonthInput, 'value', 'FEB')
    c.assert.attributeContains(dateSelectorYearInput, 'value', '2013')

    c.click(dayDown).pause(500)

    c.assert.attributeContains(dateSelectorDayInput, 'value', '28')
    c.assert.attributeContains(dateSelectorMonthInput, 'value', 'FEB')
    c.assert.attributeContains(dateSelectorYearInput, 'value', '2013')
  },

  // verify right timeline arrow is not disabled for future date
  'Added future layer and right timeline arrow is not disabled': (c) => {
    c.url(`${c.globals.url}?mockFutureLayer=VIIRS_SNPP_CorrectedReflectance_TrueColor,3D`)
    c.waitForElementVisible(dragger, TIME_LIMIT)
    c.assert.not.cssClassPresent('#right-arrow-group', 'button-disabled')
    c.click('#right-arrow-group')
    c.assert.not.cssClassPresent('#right-arrow-group', 'button-disabled')
    c.click('#right-arrow-group')
  },

  after: (c) => {
    c.end()
  }
}
