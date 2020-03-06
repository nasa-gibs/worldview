const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const localQuerystrings = require('../../reuseables/querystrings.js');

const draggerA = '.timeline-dragger.draggerA ';
const draggerB = '.timeline-dragger.draggerB ';
const dateSelectorDayInput = '#date-selector-main .input-wrapper-day input';
const dateSelectorMonthInput = '#date-selector-main .input-wrapper-month input';
const TIME_LIMIT = 20000;

module.exports = {
  before(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  // load A|B and verify that it is active
  'A|B is loaded': function(client) {
    client.url(client.globals.url + localQuerystrings.swipeAndAIsActive);
    client.waitForElementVisible(localSelectors.swipeDragger, TIME_LIMIT);
  },
  'Verify that A|B draggers are visible': function(client) {
    client.expect.element(draggerA).to.be.visible;
    client.expect.element(draggerB).to.be.visible;
  },
  'Dragging active dragger updates date': function(client) {
    client.assert.attributeContains(dateSelectorDayInput, 'value', '17');
    client.assert.attributeContains(dateSelectorMonthInput, 'value', 'AUG');

    client
      .useCss()
      .moveToElement(draggerA, 15, 15)
      .mouseButtonDown(0)
      .moveToElement(draggerB, 100, 30)
      .mouseButtonUp(0)
      .pause(2000);
    client.getValue(dateSelectorDayInput, (dayResult) => {
      client.getValue(dateSelectorMonthInput, function(monthResult) {
        const result = monthResult.value.concat(dayResult.value);
        this.assert.notEqual('AUG17', result);
      });
    });
  },
  'Clicking inactive dragger updates active state': function(client) {
    client.assert.cssClassPresent(localSelectors.aTab, 'active');
    client
      .useCss()
      .moveToElement(draggerB, 20, 20)
      .mouseButtonDown(0)
      .mouseButtonUp(0);
    // Reference labels were not active in A but are in B
    client.waitForElementVisible(
      '#activeB-Reference_Features',
      TIME_LIMIT,
      () => {
        client.assert.attributeContains(dateSelectorDayInput, 'value', '16');
      },
    );
  },
  'Dragging B dragger updates date in label': function(client) {
    client.useCss().assert.containsText(localSelectors.bTab, '2018-08-16');
    client
      .useCss()
      .moveToElement(draggerB, 20, 20)
      .mouseButtonDown(0)
      .moveToElement(draggerA, -100, 0)
      .mouseButtonUp(0)
      .pause(2000);
    client.getText(localSelectors.bTab, function(result) {
      this.assert.notEqual('B: 2018-08-16', result.value);
    });
  },
  'Deactivate A|B is no longer active': function(client) {
    client.click(localSelectors.compareButton);
    client.waitForElementNotPresent(
      localSelectors.bTab,
      TIME_LIMIT,
      () => {
        client
          .useCss()
          .assert.containsText(
            localSelectors.compareButton,
            'Start Comparison',
          );
        client.expect.element(draggerA).to.not.be.present;
        client.expect.element(draggerB).to.be.visible;
      },
    );
  },
  after(client) {
    client.end();
  },
};
