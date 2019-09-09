const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const TIME_LIMIT = 10000;
const {
  measureBtn,
  measureAreaBtn,
  measureDistanceBtn,
  clearMeasurementsBtn,
  measureMenu,
  measurementTooltip,
  sidebarContainer,
  unitOfMeasureToggle,
  greatCircleToggle
} = localSelectors;

module.exports = {
  before: function(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Clicking the measure button opens the menu': function(client) {
    client.expect.element(measureMenu).to.not.be.present;
    client.useCss().click(measureBtn);
    client.waitForElementVisible(measureMenu, TIME_LIMIT);
  },
  'Initiating a measurement causes an alert to show and sidebar to collapse': function(client) {
    client.useCss().click(measureDistanceBtn);
    client.waitForElementVisible('.wv-alert', TIME_LIMIT, (el) => {
      console.log(el);
    });
    client.useCss().assert.elementPresent(sidebarContainer);
    client.useCss().assert.cssProperty(
      sidebarContainer,
      'max-height',
      '0px');
  },
  'Cancelling a measurement causes an alert to disappear and sidebar to expand': function(client) {
    client.useCss().click(measureBtn);
    client.waitForElementVisible(measureMenu, TIME_LIMIT, (el) => {
      client.moveTo(null, -150, 50);
      client.mouseButtonClick(2);
      client.expect.element('.wv-alert').to.not.be.present;
      client.expect.element(sidebarContainer)
        .to.have.css('max-height').which.does.not.equal('0px');
    });
  },
  'Creating a distance measurement causes a tooltip to show': function(client) {
    client.useCss().click(measureBtn);
    client.waitForElementVisible(measureMenu, TIME_LIMIT, (el) => {
      client.useCss().click(measureDistanceBtn);
      client.moveTo(null, -150, 50);
      client.mouseButtonClick(0);
      client.moveTo(null, -100, -100);
      client.mouseButtonClick(0);
      client.mouseButtonClick(0);
      client.waitForElementVisible(measurementTooltip, TIME_LIMIT);
    });
  },
  'Creating a area measurement causes a tooltip to show': function(client) {
    client.useCss().click(measureBtn);
    client.waitForElementVisible(measureMenu, TIME_LIMIT, (el) => {
      client.useCss().click(measureAreaBtn);
      client.moveTo(null, -250, 10);
      client.mouseButtonClick(0);
      client.moveTo(null, 0, 100);
      client.mouseButtonClick(0);
      client.moveTo(null, 100, 0);
      client.mouseButtonClick(0);
      client.moveTo(null, 0, -100);
      client.mouseButtonClick(0);
      client.mouseButtonClick(0);
      client.expect.elements(measurementTooltip).count.to.equal(2);
      client.waitForElementVisible(measurementTooltip, TIME_LIMIT);
    });
  },
  'Toggling unit of measure updates the measurement value': async function(client) {
    client.click(measureBtn);
    await client.waitForElementVisible(measureMenu, TIME_LIMIT);
    await client.click(unitOfMeasureToggle);
    const tooltips = await client.elements('css selector', measurementTooltip);
    tooltips.value.forEach((element) => {
      client.elementIdText(element.ELEMENT, (elResult) => {
        const pass = elResult.value.includes('mi');
        client.assert.ok(pass);
      });
    });
  },
  'Toggling great circle changes the measurement value': async function(client) {
    const measureTooltips = await client.elements('css selector', measurementTooltip);
    const elPromises = measureTooltips.value.map(el => client.elementIdText(el.ELEMENT, res => res.value));
    const initMeasureValues = await Promise.all(elPromises).then(elem => elem.map(el => el.value));

    await client.click(greatCircleToggle);
    const updatedElPromises = measureTooltips.value.map(el => client.elementIdText(el.ELEMENT, res => res.value));
    const updatedValues = await Promise.all(updatedElPromises).then(elem => elem.map(el => el.value));
    updatedValues.forEach((value, index) => {
      const prevValue = initMeasureValues[index];
      client.assert.ok(value !== prevValue);
    });
  },
  'Clearing a measurements removes all tooltips': function(client) {
    client.waitForElementVisible(measureMenu, TIME_LIMIT, (el) => {
      client.useCss().click(clearMeasurementsBtn);
      client.expect.elements(measurementTooltip).count.to.equal(0);
    });
  },
  after: function(client) {
    client.end();
  }
};
