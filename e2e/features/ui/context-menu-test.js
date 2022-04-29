// const reuseables = require('../../reuseables/skip-tour.js');
// const selectors = require('../../reuseables/selectors.js');

// const {
//   contextMenu,
//   contextMenuCopy,
//   contextMenuAddMarker,
//   contextMenuDistance,
//   contextMenuArea,
//   contentMenuChangeUnits,
//   geoMeasurementTooltip,
//   measureBtn,
//   unitOfMeasureToggle,
// } = selectors;

// const TIME_LIMIT = 1000;

// function openContextMenu(c, startX, startY) {
//   c.moveToElement('#wv-map-geographic', startX, startY);
//   c.mouseButtonClick('right');
//   c.waitForElementVisible(contextMenu);
// }

// function createDistanceMeasurement(c, [startX, startY], [endX, endY]) {
//   c.waitForElementVisible('#measurement-alert', TIME_LIMIT);
//   c.moveToElement('#wv-map-geographic', startX, startY)
//     .mouseButtonClick(0);
//   c.pause(200);
//   c.moveToElement('#wv-map-geographic', endX, endY)
//     .mouseButtonClick(0)
//     .mouseButtonClick(0)
//     .pause(100);
// }

// module.exports = {
//   before: (c) => {
//     reuseables.loadAndSkipTour(c, TIME_LIMIT);
//   },

//   'Verify context menu opens on right-click': (c) => {
//     if (c.options.desiredCapabilities.browserName === 'firefox') {
//       return;
//     }
//     openContextMenu(c, 500, 200);
//     c.expect.element(contextMenu).to.be.present;
//   },

//   'Copying coordinates from context menu triggers "Copied to Clipboard" tooltip': (c) => {
//     if (c.options.desiredCapabilities.browserName === 'firefox') {
//       return;
//     }
//     c.click(contextMenuCopy);
//     c.waitForElementVisible('.tooltip-inner', 6000);
//     c.assert.containsText('.tooltip-inner', 'Copied to clipboard!');
//   },

//   'Adding a marker after clicking "Add Place Marker" in context menu': (c) => {
//     if (c.options.desiredCapabilities.browserName === 'firefox') {
//       return;
//     }
//     openContextMenu(c, 500, 200);
//     c.moveToElement(contextMenuAddMarker, 10, 10);
//     c.mouseButtonClick('left');
//     c.waitForElementVisible('#marker-pin');
//     c.expect.element('#marker-pin').to.be.visible;
//   },

//   'Creating a distance measurement after clicking "Measure Distance" in context menu': (c) => {
//     if (c.options.desiredCapabilities.browserName === 'firefox') {
//       return;
//     }
//     openContextMenu(c, 525, 200);
//     c.click(contextMenuDistance);
//     c.pause(200);
//     createDistanceMeasurement(c, [400, 200], [450, 300]);
//     c.waitForElementVisible(geoMeasurementTooltip, TIME_LIMIT);
//     c.expect.elements(geoMeasurementTooltip).count.to.equal(1);
//   },

//   'Creating a area measurement after clicking "Measure Area" in context menu': (c) => {
//     if (c.options.desiredCapabilities.browserName === 'firefox') {
//       return;
//     }
//     openContextMenu(c, 550, 200);
//     c.click(contextMenuArea);
//     c.waitForElementVisible('#measurement-alert', TIME_LIMIT, (el) => {
//       c.moveTo(null, -250, 10);
//       c.mouseButtonClick(0);
//       c.pause(200);
//       c.moveTo(null, 0, 100);
//       c.mouseButtonClick(0);
//       c.pause(200);
//       c.moveTo(null, 100, 0);
//       c.mouseButtonClick(0);
//       c.pause(200);
//       c.moveTo(null, 0, -100);
//       c.mouseButtonClick(0);
//       c.mouseButtonClick(0);
//       c.waitForElementVisible(geoMeasurementTooltip, TIME_LIMIT);
//       c.expect.elements(geoMeasurementTooltip).count.to.equal(2);
//     });
//   },

//   'Change measurement units to miles after click "Change Units to mi" in context menu': (c) => {
//     if (c.options.desiredCapabilities.browserName === 'firefox') {
//       return;
//     }
//     openContextMenu(c, 575, 200);
//     c.click(contentMenuChangeUnits);
//     c.click(measureBtn);
//     c.waitForElementVisible(unitOfMeasureToggle);
//     c.assert.containsText(unitOfMeasureToggle, 'mi');
//   },

//   after: (c) => {
//     c.end();
//   },
// };
