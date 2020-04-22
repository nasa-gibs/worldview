const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const localQuerystrings = require('../../reuseables/querystrings.js');

const dateSelectorMinuteInput = '#date-selector-main .input-wrapper-minute input';
const dateSelectorHourInput = '#date-selector-main .input-wrapper-hour input';
const dateSelectorDayInput = '#date-selector-main .input-wrapper-day input';
const dateSelectorMonthInput = '#date-selector-main .input-wrapper-month input';
const dateSelectorYearInput = '#date-selector-main .input-wrapper-year input';
const TIME_LIMIT = 20000;

module.exports = {
  beforeEach: (client) => {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
  },

  // verify subdaily default year, month, day, hour, minute date selector inputs
  'Verify subdaily default year, month, day, hour, minute date selector inputs': (client) => {
    client.url(client.globals.url + localQuerystrings.subdailyLayerIntervalTimescale);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client.expect.element(dateSelectorMinuteInput).to.be.visible;
    client.expect.element(dateSelectorHourInput).to.be.visible;
    client.expect.element(dateSelectorDayInput).to.be.visible;
    client.expect.element(dateSelectorMonthInput).to.be.visible;
    client.expect.element(dateSelectorYearInput).to.be.visible;
    client.end();
  },

  // verify change date using left/right date arrows
  'Change date using left/right arrows': (client) => {
    client.url(client.globals.url + localQuerystrings.knownDate);
    client.assert.attributeContains(dateSelectorDayInput, 'value', '22');
    client.click('#left-arrow-group');
    client.assert.attributeContains(dateSelectorDayInput, 'value', '21');
    client.click('#right-arrow-group');
    client.assert.attributeContains(dateSelectorDayInput, 'value', '22');
  },

  // verify default left arrow enabled since loaded on current day
  'Left timeline arrow will not be disabled by default': (client) => {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
    client.assert.cssClassNotPresent('#left-arrow-group', 'button-disabled');
  },

  // verify default right arrow disabled since loaded on current day
  'Right timeline arrow will be disabled by default': (client) => {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
    client.assert.cssClassPresent('#right-arrow-group', 'button-disabled');
  },

  // verify valid right arrow enabled since NOT loaded on current day
  'Right timeline arrow will not be disabled': (client) => {
    client.url(client.globals.url + localQuerystrings.knownDate);
    client.assert.cssClassNotPresent('#right-arrow-group', 'button-disabled');
  },

  // verify date selector is populated with date YYYY-MON-DD
  'Verify date selector is populated with date YYYY-MON-DD': (client) => {
    client.url(`${client.globals.url}?t=2019-02-22`);
    client.assert.attributeContains(dateSelectorDayInput, 'value', '22');
    client.assert.attributeContains(dateSelectorMonthInput, 'value', 'FEB');
    client.assert.attributeContains(dateSelectorYearInput, 'value', '2019');
  },

  // verify subdaily date selector is populated with date YYYY-MON-DD-HH-MM
  'Verify subdaily date selector is populated with date YYYY-MON-DD-HH-MM': (client) => {
    client.url(client.globals.url + localQuerystrings.subdailyLayerIntervalTimescale);

    client.assert.attributeContains(dateSelectorMinuteInput, 'value', '46');
    client.assert.attributeContains(dateSelectorHourInput, 'value', '09');
    client.assert.attributeContains(dateSelectorDayInput, 'value', '04');
    client.assert.attributeContains(dateSelectorMonthInput, 'value', 'OCT');
    client.assert.attributeContains(dateSelectorYearInput, 'value', '2019');
  },

  // verify user can temporarily input incorrect day values in date selector
  'Allow invalid day values in date selector': (client) => {
    client.url(`${client.globals.url}?t=2019-02-22`);
    client
      .click(dateSelectorDayInput)
      .setValue(dateSelectorDayInput, [31, client.Keys.ENTER]);
    client.assert.cssClassPresent(dateSelectorDayInput, 'invalid-input');
  },

  // verify user can change year on invalid date to a valid one and remove invalid-input class
  'Allow invalid year to valid year values in date selector': (client) => {
    client.url(`${client.globals.url}?t=2019-02-22`);
    client
      .click(dateSelectorYearInput)
      .setValue(dateSelectorYearInput, [2020, client.Keys.ENTER]);
    client.setValue(dateSelectorMonthInput, ['MAR', client.Keys.ENTER]);
    client.setValue(dateSelectorDayInput, [31, client.Keys.ENTER]);
    client.setValue(dateSelectorYearInput, [2019, client.Keys.ENTER]);
    client.assert.cssClassNotPresent(dateSelectorDayInput, 'invalid-input');
    client.assert.cssClassNotPresent(dateSelectorMonthInput, 'invalid-input');
    client.assert.cssClassNotPresent(dateSelectorYearInput, 'invalid-input');
  },

  // date selector up arrow rolls over from Feb 28 to 1 (non leap year) and the inverse
  'Date selector up arrow rolls over from Feb 28 to 1 (non leap year) and the inverse': (client) => {
    client.url(`${client.globals.url}?t=2013-02-28`);
    client.waitForElementVisible(localSelectors.dragger, TIME_LIMIT);
    client
      .click('div.input-wrapper.input-wrapper-day > div.date-arrows.date-arrow-up')
      .pause(500);

    client.assert.attributeContains(dateSelectorDayInput, 'value', '01');
    client.assert.attributeContains(dateSelectorMonthInput, 'value', 'FEB');
    client.assert.attributeContains(dateSelectorYearInput, 'value', '2013');

    client
      .click('div.input-wrapper.input-wrapper-day > div.date-arrows.date-arrow-down')
      .pause(500);

    client.assert.attributeContains(dateSelectorDayInput, 'value', '28');
    client.assert.attributeContains(dateSelectorMonthInput, 'value', 'FEB');
    client.assert.attributeContains(dateSelectorYearInput, 'value', '2013');
  },

  after: (client) => {
    client.end();
  },
};
