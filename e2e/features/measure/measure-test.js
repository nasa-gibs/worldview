const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const { switchProjection } = require('../../reuseables/switch-projection');

const TIME_LIMIT = 10000;

const {
  measureBtn,
  measureAreaBtn,
  measureDistanceBtn,
  clearMeasurementsBtn,
  measureMenu,
  measurementTooltip,
  geoMeasurementTooltip,
  arcticMeasurementTooltip,
  sidebarContainer,
  unitOfMeasureToggle,
  downloadGeojsonBtn,
  // downloadShapefileBtn,
} = localSelectors;

function createDistanceMeasurement(c, [startX, startY], [endX, endY]) {
  c.useCss().click(measureBtn);
  c.waitForElementVisible(measureMenu);
  c.useCss().click(measureDistanceBtn);
  c.pause(200);
  c.waitForElementVisible('#measurement-alert', TIME_LIMIT);
  c.moveToElement('#wv-map-geographic', startX, startY)
    .mouseButtonClick(0);
  c.pause(200);
  c.moveToElement('#wv-map-geographic', endX, endY)
    .mouseButtonClick(0)
    .mouseButtonClick(0)
    .pause(100);
}

module.exports = {
  before(c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
  },
  'Clicking the measure button opens the menu': (c) => {
    c.expect.element(measureMenu).to.not.be.present;
    c.useCss().click(measureBtn);
    c.waitForElementVisible(measureMenu, TIME_LIMIT);
    c.pause(300);
  },
  'Initiating a measurement causes an alert to show and sidebar to collapse': (c) => {
    c.useCss().click(measureDistanceBtn);
    c.waitForElementVisible('#measurement-alert', TIME_LIMIT);
    c.useCss().assert.elementPresent(sidebarContainer);
    c.useCss().assert.cssProperty(
      sidebarContainer,
      'max-height',
      '0px',
    );
    c.pause(300);
  },
  'Cancelling a measurement causes an alert to disappear and sidebar to expand': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') { // right click doesn't work in firefox
      return;
    }
    c.moveToElement('#wv-map-geographic', 200, 110)
      .mouseButtonClick(0)
      .moveTo(null, 200, 210)
      .mouseButtonClick(1)
      .mouseButtonClick(0);
    c.pause(300);
    c.expect.element('#measurement-alert').to.not.be.present;
    c.expect.element(sidebarContainer)
      .to.have.css('max-height').which.does.not.equal('0px');
  },
  'Creating a distance measurement causes a tooltip to show': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return;
    }
    createDistanceMeasurement(c, [400, 200], [450, 300]);
    createDistanceMeasurement(c, [350, 250], [350, 220]);
    c.waitForElementVisible(geoMeasurementTooltip, TIME_LIMIT);
    c.expect.elements(geoMeasurementTooltip).count.to.equal(2);
  },
  'Creating a area measurement causes a tooltip to show': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return;
    }
    c.useCss().click(measureBtn);
    c.waitForElementVisible(measureMenu, TIME_LIMIT, (el) => {
      c.useCss().click(measureAreaBtn);
      c.moveTo(null, -250, 10);
      c.mouseButtonClick(0);
      c.pause(200);
      c.moveTo(null, 0, 100);
      c.mouseButtonClick(0);
      c.pause(200);
      c.moveTo(null, 100, 0);
      c.mouseButtonClick(0);
      c.pause(200);
      c.moveTo(null, 0, -100);
      c.mouseButtonClick(0);
      c.mouseButtonClick(0);
      c.waitForElementVisible(geoMeasurementTooltip, TIME_LIMIT);
      c.expect.elements(geoMeasurementTooltip).count.to.equal(3);
    });
  },
  'Download as GeoJSON and Shapefile options available in menu': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return;
    }
    c.click(measureBtn);
    c.waitForElementVisible(downloadGeojsonBtn);
    // c.waitForElementVisible(downloadShapefileBtn);
    c.click('.modal');
  },
  'Switching to arctic projection, no measurements show': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return;
    }
    switchProjection(c, 'arctic');
    c.expect.elements(arcticMeasurementTooltip).count.to.equal(0);
  },
  'Download as GeoJSON and Shapefile options NOT available in menu': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return;
    }
    c.click(measureBtn);
    c.expect.element(downloadGeojsonBtn).to.not.be.present;
    // c.expect.element(downloadShapefileBtn).to.not.be.present;
    c.click('.modal');
  },
  'Creating measurements in arctic projection causes tooltips to show': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return;
    }
    createDistanceMeasurement(c, [500, 200], [650, 300]);
    createDistanceMeasurement(c, [450, 350], [550, 220]);
    c.waitForElementVisible(arcticMeasurementTooltip, TIME_LIMIT);
    c.expect.elements(arcticMeasurementTooltip).count.to.equal(2);
  },
  'Clearing a measurements removes all tooltips in this projection only': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') { // c.elements() returns different values for firefox
      return;
    }
    c.useCss().click(measureBtn);
    c.waitForElementVisible(measureMenu, TIME_LIMIT, (el) => {
      c.useCss().click(clearMeasurementsBtn);
      c.expect.elements(arcticMeasurementTooltip).count.to.equal(0);
      c.expect.elements(geoMeasurementTooltip).count.to.equal(3);
    });
  },
  'Switching back to geographic projection, three measurements show again': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') { // c.elements() returns different values for firefox
      return;
    }
    switchProjection(c, 'geographic');
    c.expect.elements(geoMeasurementTooltip).count.to.equal(3);
  },
  'Toggling unit of measure updates the measurement value': async(c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') { // c.elements() returns different values for firefox
      return;
    }
    c.click(measureBtn);
    await c.waitForElementVisible(measureMenu, TIME_LIMIT);
    await c.click(unitOfMeasureToggle);
    const tooltips = await c.elements('css selector', measurementTooltip);
    tooltips.value.forEach((element) => {
      c.elementIdText(element.ELEMENT, (elResult) => {
        const pass = elResult.value.includes('mi');
        c.assert.ok(pass);
      });
    });
  },
  'Clearing a measurements removes all tooltips': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') { // c.elements() returns different values for firefox
      return;
    }
    c.waitForElementVisible(measureMenu);
    c.useCss().click(clearMeasurementsBtn);
    c.expect.elements(measurementTooltip).count.to.equal(0);
  },
  after(c) {
    c.end();
  },
};
