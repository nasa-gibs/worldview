const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('./selectors.js');
const localQuerystrings = require('./querystrings.js');
const activeDragger = '.ab-group-case-active';
const inactiveDragger = '.ab-group-case-inactive';
const dateSelectorDayInput = '#date-selector-main .input-wrapper-day input';
const dateSelectorMonthInput = '#date-selector-main .input-wrapper-month input';
const TIME_LIMIT = 10000;

module.exports = {
  before: function(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  // load A|B and verify that it is active
  'A|B is loaded': function(client) {
    client.url(client.globals.url + localQuerystrings.swipeAndAIsActive);
    client.waitForElementVisible(localSelectors.swipeDragger, TIME_LIMIT);
  },
  'Verify that A|B draggers are visible': function(client) {
    client.expect.element(activeDragger).to.be.visible;
    client.expect.element(inactiveDragger).to.be.visible;
  },
  'Verify that Guitar pick is not visible': function(client) {
    client.expect.element('#guitarpick').to.not.be.visible;
  },
  'Dragging active dragger updates date': function(client) {
    client.assert.attributeContains(dateSelectorDayInput, 'value', '17');
    client.assert.attributeContains(dateSelectorMonthInput, 'value', 'AUG');

    client
      .useCss()
      .moveToElement(activeDragger, 10, 10)
      .mouseButtonDown(0)
      .moveToElement('#timeline-header', 0, 0)
      .mouseButtonUp(0)
      .pause(2000);
    client.getValue(dateSelectorDayInput, function(dayResult) {
      client.getValue(dateSelectorMonthInput, function(monthResult) {
        var result = monthResult.value.concat(dayResult.value);
        this.assert.notEqual('AUG17', result);
      });
    });
  },
  'Clicking inactive dragger updates active state': function(client) {
    client.assert.cssClassPresent(localSelectors.aTab, 'active');
    client
      .useCss()
      .moveToElement(inactiveDragger, 10, 10)
      .mouseButtonDown(0)
      .mouseButtonUp(0);
    // Reference labels were not active in A but are in B
    client.waitForElementVisible(
      '#activeB-Reference_Features',
      TIME_LIMIT,
      function() {
        client.assert.attributeContains(dateSelectorDayInput, 'value', '16');
      }
    );
  },
  'Dragging B dragger updates date in label': function(client) {
    client.useCss().assert.containsText(localSelectors.bTab, 'B: 2018-08-16');
    client
      .useCss()
      .moveToElement(activeDragger, 10, 10)
      .mouseButtonDown(0)
      .moveToElement('#timeline-header', 0, 0)
      .mouseButtonUp(0)
      .pause(2000);
    client.getText(localSelectors.bTab, function(result) {
      this.assert.notEqual('B: 2018-08-16', result.value);
    });
  },
  'Deactivate A|B and verify guitarpick is the only dragger visible': function(
    client
  ) {
    client.click(localSelectors.compareButton);
    client.waitForElementVisible('#guitarpick', TIME_LIMIT, function() {
      client.expect.element(activeDragger).to.not.be.visible;
      client.expect.element(inactiveDragger).to.not.be.visible;
    });
  },
  after: function(client) {
    client.end();
  }
};
