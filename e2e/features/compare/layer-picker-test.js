const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('./selectors.js');
const layerSelectors = require('../layers/selectors.js');
const localQuerystrings = require('./querystrings.js');
const blueMarbleCheckBox = '#blue-marble-nasaeo-modis .measurement-settings-item .iCheck';
const aodCheckBox = '#aerosol-optical-depth-terra-misr .measurement-settings-item .iCheck';
const TIME_LIMIT = 10000;
module.exports = {
  // before: function (client) {
  //   reuseables.loadAndSkipTour(client, TIME_LIMIT);
  // },
  'Add AOD Layer to Layer Group A': function(client) {
    client.url(client.globals.url + localQuerystrings.swipeAndAIsActive);
    client.waitForElementVisible(localSelectors.swipeDragger, TIME_LIMIT, function() {
      client.click(layerSelectors.addLayers);
      client.waitForElementVisible(layerSelectors.aerosolOpticalDepth, TIME_LIMIT, function() {
        client.click(layerSelectors.aerosolOpticalDepth);
        client.waitForElementVisible(aodCheckBox, 20000, function() {
          client.click(aodCheckBox);
          client.waitForElementVisible('#active-MISR_Aerosol_Optical_Depth_Avg_Green_Monthly', TIME_LIMIT);
          client.click(layerSelectors.layersModalCloseButton);
        });
      });
    });
  },
  'Toggle compare mode to Active state B': function(client) {
    client.click(localSelectors.bTab);
    client.waitForElementVisible('#activeB-Coastlines', TIME_LIMIT);
  },
  'Verify that AOD layer is not visible': function(client) {
    client.expect.element('#active-MISR_Aerosol_Optical_Depth_Avg_Green_Monthly').to.not.be.visible;
  },
  'Add Blue marble layer to Active state B and verify it has been added': function(client) {
    client.click(layerSelectors.addLayers);
    client.waitForElementVisible(layerSelectors.aerosolOpticalDepth, TIME_LIMIT, function() {
      client.click('#layer-category-item-legacy-all-blue-marble');
      client.waitForElementVisible(blueMarbleCheckBox, 20000, function() {
        client.click(blueMarbleCheckBox);
        client.waitForElementVisible('#activeB-BlueMarble_NextGeneration', TIME_LIMIT);
        client.expect.element('#activeB-MISR_Aerosol_Optical_Depth_Avg_Green_Monthly').to.not.be.present;
        client.expect.element('#active-MISR_Aerosol_Optical_Depth_Avg_Green_Monthly').to.not.be.visible;
      });
    });
  },
  'Verify that AOD is visible and Blue marbel is not present in Layer list A': function(client) {
    client.click(layerSelectors.layersModalCloseButton);
    client.pause(100);
    client.click(localSelectors.aTab);
    client.waitForElementVisible('#active-MISR_Aerosol_Optical_Depth_Avg_Green_Monthly', TIME_LIMIT, function() {
      client.expect.element('#activeB-BlueMarble_NextGeneration').to.not.be.visible;
      client.expect.element('#active-BlueMarble_NextGeneration').to.not.be.present;
    });
  },
  after: function(client) {
    client.end();

  }
};
