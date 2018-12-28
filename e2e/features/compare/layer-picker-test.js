const reuseables = require('../../reuseables/skip-tour.js');
const selectors = require('../../reuseables/selectors.js');
const localQuerystrings = require('../../reuseables/querystrings.js');
const aodCheckBox =
  '#checkbox-case-MISR_Aerosol_Optical_Depth_Avg_Green_Monthly .wv-checkbox';
const aodIndexCheckbox = '#checkbox-case-OMI_Aerosol_Index .wv-checkbox';
const TIME_LIMIT = 20000;
module.exports = {
  before: function(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Add AOD Layer to Layer Group A': function(client) {
    client.url(client.globals.url + localQuerystrings.swipeAndAIsActive);
    client.waitForElementVisible(
      selectors.swipeDragger,
      TIME_LIMIT,
      function() {
        client.click(selectors.addLayers);
        client.waitForElementVisible(
          selectors.aerosolOpticalDepth,
          TIME_LIMIT,
          function() {
            client.click(selectors.aerosolOpticalDepth);
            client.waitForElementVisible(aodCheckBox, 20000, function() {
              client.click(aodCheckBox);
              client.waitForElementVisible(
                '#active-MISR_Aerosol_Optical_Depth_Avg_Green_Monthly',
                TIME_LIMIT
              );
              client.click(selectors.layersModalCloseButton);
            });
          }
        );
      }
    );
  },
  'Toggle compare mode to Active state B': function(client) {
    client.click(selectors.bTab);
    client.waitForElementVisible('#activeB-Coastlines', TIME_LIMIT);
  },
  'Verify that AOD layer is not visible': function(client) {
    client.expect.element(
      '#active-MISR_Aerosol_Optical_Depth_Avg_Green_Monthly'
    ).to.not.be.visible;
  },
  'Add AOD index layer to Active state B and verify it has been added': function(
    client
  ) {
    client.click(selectors.addLayers);
    client.waitForElementVisible(
      selectors.aerosolOpticalDepth,
      TIME_LIMIT,
      function() {
        client.click(
          '#layer-category-item-legacy-all-aerosol-index .layer-category-name'
        );
        client.waitForElementVisible(aodIndexCheckbox, 20000, function() {
          client.click(aodIndexCheckbox);
          client.waitForElementVisible(
            '#activeB-OMI_Aerosol_Index',
            TIME_LIMIT
          );
          client.expect.element(
            '#activeB-MISR_Aerosol_Optical_Depth_Avg_Green_Monthly'
          ).to.not.be.present;
          client.expect.element(
            '#active-MISR_Aerosol_Optical_Depth_Avg_Green_Monthly'
          ).to.not.be.visible;
        });
      }
    );
  },
  'Verify that AOD green is visible and AOD index is not present in Layer list A': function(
    client
  ) {
    client.click(selectors.layersModalCloseButton);
    client.pause(100);
    client.click(selectors.aTab);
    client.waitForElementVisible(
      '#active-MISR_Aerosol_Optical_Depth_Avg_Green_Monthly',
      TIME_LIMIT,
      function() {
        client.expect.element('#activeB-OMI_Aerosol_Index').to.not.be.visible;
        client.expect.element('#activeA-OMI_Aerosol_Index').to.not.be.present;
      }
    );
  },
  after: function(client) {
    client.end();
  }
};
