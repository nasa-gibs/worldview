const skipTour = require('../../reuseables/skip-tour.js');
const mobileDatePickerSelectBtn = '#date-selector-main .mobile-date-picker-select-btn';
const nextDayArrowContainer = '#right-arrow-group';
const datepickerHeader = '.datepicker .datepicker-header';
const TIME_LIMIT = 10000;

module.exports = {
  before: c => {
    skipTour.loadAndSkipTour(c, TIME_LIMIT);
    c.url(c.globals.url + '?now=2013-03-15T0');
    c.resizeWindow(375, 667); // iPhone 6/7/8 dimensions
  },
  'Before 3:00 UTC: load yesterdays date': c => {
    c.waitForElementVisible(mobileDatePickerSelectBtn, TIME_LIMIT, e => {
      c.assert.containsText(mobileDatePickerSelectBtn, '2013-03-14');
    });
  },
  'Before 3:00 UTC: right button is not disabled': c => {
    c.expect.element(nextDayArrowContainer).to.be.present;
    c.expect.element(nextDayArrowContainer + '.button-disabled').to.not.be.present;
    c.click(nextDayArrowContainer);
    c.waitForElementVisible(nextDayArrowContainer + '.button-disabled', TIME_LIMIT);
  },
  'After 3:00 UTC: load todays date': c => {
    c.url(c.globals.url + '?now=2013-03-15T4');
    c.waitForElementVisible(mobileDatePickerSelectBtn, TIME_LIMIT, e => {
      c.assert.containsText(mobileDatePickerSelectBtn, '2013-03-15');
    });
  },
  'After 3:00 UTC: right button is  disabled': c => {
    c.expect.element(nextDayArrowContainer).to.be.present;
    c.expect.element(nextDayArrowContainer + '.button-disabled').to.be.present;
  },
  'date.mob.range.1: Date label should show 2013-07-20': c => {
    c.url(c.globals.url + '?now=2013-03-15T12');
    c.waitForElementVisible(mobileDatePickerSelectBtn, TIME_LIMIT, e => {
      c.assert.containsText(mobileDatePickerSelectBtn, '2013-03-15');
    });
  },
  'mobile selector header should show 2013-03-15': c => {
    c.click(mobileDatePickerSelectBtn);
    c.waitForElementVisible(datepickerHeader, TIME_LIMIT, e => {
      c.assert.containsText(datepickerHeader, '2013-03-15');
    });
  },
  'date.mob.range.3: Date label should show 2012-03-15 after year drag': c => {
    c.moveToElement('xpath', "//li[text()='2013']", 15, 15)
      .mouseButtonDown(0)
      .moveToElement('xpath', "//li[contains(@class, 'disabled') and text()='2014']", 10, 10)
      .mouseButtonUp(0);
    c.pause(1000);
    c.useCss();
    c.assert.containsText(datepickerHeader, '2012-03-15');
  },
  'Date in header should be 2012-01-15 after month drag': c => {
    c.moveToElement('xpath', "//li[text()='01']", 10, 10)
      .mouseButtonDown(0)
      .moveToElement('xpath', "//li[text()='03']", 10, 10)
      .mouseButtonUp(0);
    c.pause(1000);
    c.useCss();
    c.assert.containsText(datepickerHeader, '2012-01-15');
  },
  'Date in header should be 2012-01-19 after day drag': c => {
    c.moveToElement('xpath', "//li[text()='17']", 2, 2)
      .mouseButtonDown(0)
      .moveToElement('xpath', "//li[text()='13']", 10, 10)
      .mouseButtonUp(0);
    c.pause(1000);
    c.useCss();
    c.assert.containsText(datepickerHeader, '2012-01-19');
  },
  'Click okay button verify date has updated': c => {
    c.useXpath().click("//a[text()='OK']");
    c.pause(1000);
    c.useCss();
    c.assert.containsText(mobileDatePickerSelectBtn, '2012-01-19');
  },
  'date.mob.nav.1: Date label should show 2013-07-20': c => {
    c.url(c.globals.url + '?now=2014-03-15&t=2013-07-20T12');
    c.waitForElementVisible(mobileDatePickerSelectBtn, TIME_LIMIT, e => {
      c.assert.containsText(mobileDatePickerSelectBtn, '2013-07-20');
    });
  },
  'mobile selector header should show 2013-07-20': c => {
    c.click(mobileDatePickerSelectBtn);
    c.waitForElementVisible(datepickerHeader, TIME_LIMIT, e => {
      c.assert.containsText(datepickerHeader, '2013-07-20');
    });
  },
  'Year 2014 should be disabled and 2013 is not': c => {
    c.waitForElementVisible(datepickerHeader, TIME_LIMIT, () => {
      c.useXpath(); // https://github.com/nightwatchjs/nightwatch/issues/633#issuecomment-222968466
      c.expect.element("//li[contains(@class, 'disabled') and text()='2014']").to.be.present;
      c.expect.element("//li[contains(@class, 'disabled') and text()='2013']").to.not.be.present;
      c.expect.element("//li[text()='2013']").to.be.present;
    });
  },
  'Date in header should be 2013-02-20 after year drag': c => {
    c.moveToElement('xpath', "//li[text()='06']", 15, 15)
      .mouseButtonDown(0)
      .moveToElement('xpath', "//li[text()='09']", 10, 10)
      .mouseButtonUp(0)
      .pause(1000)
      .moveToElement('xpath', "//li[text()='03']", 15, 15)
      .mouseButtonDown(0)
      .moveToElement('xpath', "//li[text()='05']", 10, 10)
      .mouseButtonUp(0);
    c.pause(1000);
    c.useCss();
    c.assert.containsText(datepickerHeader, '2013-02-20');
  },
  'date.mob.nav.4: Date label should show 2014-02-20 after year drag': c => {
    c.moveToElement('xpath', "//li[text()='2013']", 15, 15)
      .mouseButtonDown(0)
      .moveToElement('xpath', "//li[text()='2012']", 10, 10)
      .mouseButtonUp(0);
    c.pause(1000);
    c.useCss();
    c.assert.containsText(datepickerHeader, '2014-02-20');
  },
  'Date in header should be 2013-12-20 after year drag': c => {
    c.moveToElement('xpath', "//li[text()='02']", 15, 15)
      .mouseButtonDown(0)
      .moveToElement('xpath', "//li[text()='04']", 10, 10)
      .mouseButtonUp(0);
    c.pause(1000);
    c.useCss();
    c.assert.containsText(datepickerHeader, '2013-12-20');
  },
  'Click okay button verify date has updated to 2013-12-20': c => {
    c.useXpath().click("//a[text()='OK']");
    c.pause(1000);
    c.useCss();
    c.assert.containsText(mobileDatePickerSelectBtn, '2013-12-20');
  },
  after: c => {
    c.end();
  }
};
