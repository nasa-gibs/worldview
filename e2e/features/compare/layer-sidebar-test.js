const reuseables = require('../../reuseables/skip-tour.js');
const selectors = require('../../reuseables/selectors.js');
const localQueryStrings = require('../../reuseables/querystrings.js');

const aodCombinedValueId = 'MODIS_Combined_Value_Added_AOD';
const aodMAIACId = 'MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth';
const aodCheckBox = '#checkbox-case-MODIS_Combined_Value_Added_AOD .wv-checkbox';
const aodMAIACCheckbox = '#checkbox-case-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth .wv-checkbox';
const TIME_LIMIT = 10000;

module.exports = {
  before: (client) => {
    reuseables.loadAndSkipTour(client, client.globals.timeout);
  },
  'Add AOD Layer to Layer Group A': (client) => {
    client.url(client.globals.url + localQueryStrings.swipeAndAIsActive);
    client.waitForElementVisible(selectors.swipeDragger, client.globals.timeout, () => {
      client.click(selectors.addLayers);
      client.waitForElementVisible(selectors.aerosolOpticalDepth, client.globals.timeout, () => {
        client.click(selectors.aerosolOpticalDepth);
        client.waitForElementVisible(aodCheckBox, client.globals.timeout, () => {
          client.click(aodCheckBox);
          client.waitForElementVisible(`#active-${aodCombinedValueId}`, client.globals.timeout);
          client.click(selectors.layersModalCloseButton);
        });
      });
    });
    client.waitForElementNotPresent('#layer_picker_component', TIME_LIMIT);
    client.pause(250);
  },
  'Toggle compare mode to Active state B': (client) => {
    client.click(`${selectors.bTab} .productsIcon`);
    client.waitForElementVisible('#activeB-Coastlines', client.globals.timeout);
  },
  'Verify that AOD layer is not visible': (client) => {
    client.expect.element(`#active-${aodCombinedValueId}`).to.not.be.present;
  },
  'Add AOD index layer to Active state B and verify it has been added': (client) => {
    client.click(selectors.addLayers);
    client.waitForElementVisible(
      aodMAIACCheckbox,
      client.globals.timeout, () => {
        client.click(aodMAIACCheckbox);
        client.waitForElementVisible(
          '#activeB-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth',
          client.globals.timeout,
        );
        client.expect.element(`#activeB-${aodCombinedValueId}`).to.not.be.present;
        client.expect.element(`#active-${aodCombinedValueId}`).to.not.be.present;
      },
    );
  },
  'Verify that AOD combined is visible and AOD index is not present in Layer list A': function(
    client,
  ) {
    client.click(selectors.layersModalCloseButton);
    client.pause(100);
    client.click(selectors.aTab);
    client.waitForElementVisible(
      `#active-${aodCombinedValueId}`,
      client.globals.timeout,
      () => {
        client.expect.element(`#activeB-${aodCombinedValueId}`).to.not.be.present;
        client.expect.element(`#activeA-${aodMAIACId}`).to.not.be.present;
      },
    );
  },
  after(client) {
    client.end();
  },
};
