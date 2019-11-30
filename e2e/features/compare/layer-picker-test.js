const reuseables = require('../../reuseables/skip-tour.js');
const selectors = require('../../reuseables/selectors.js');
const localQuerystrings = require('../../reuseables/querystrings.js');
const aodCombinedValueId = 'MODIS_Combined_Value_Added_AOD';
const aodCheckBox =
  '#checkbox-case-MODIS_Combined_Value_Added_AOD .wv-checkbox';
const aodIndexCheckbox = '#checkbox-case-OMI_Aerosol_Index .wv-checkbox';
const TIME_LIMIT = 10000;

module.exports = {
  before: function(client) {
    reuseables.loadAndSkipTour(client, client.globals.timeout);
  },
  'Add AOD Layer to Layer Group A': function(client) {
    client.url(client.globals.url + localQuerystrings.swipeAndAIsActive);
    client.waitForElementVisible(
      selectors.swipeDragger,
      client.globals.timeout,
      function() {
        client.click(selectors.addLayers);
        client.waitForElementVisible(
          selectors.aerosolOpticalDepth,
          client.globals.timeout,
          function() {
            client.click(selectors.aerosolOpticalDepth);
            client.waitForElementVisible(aodCheckBox, client.globals.timeout, function() {
              client.click(aodCheckBox);
              client.waitForElementVisible(
                '#active-' + aodCombinedValueId,
                client.globals.timeout
              );
              client.click(selectors.layersModalCloseButton);
            });
          }
        );
      }
    );
    client.waitForElementNotPresent('#layer_picker_component', TIME_LIMIT);
    client.pause(250);
  },
  'Toggle compare mode to Active state B': function(client) {
    client.click(selectors.bTab + ' .productsIcon');
    client.waitForElementVisible('#activeB-Coastlines', client.globals.timeout);
  },
  'Verify that AOD layer is not visible': function(client) {
    client.expect.element('#active-' + aodCombinedValueId).to.not.be.visible;
  },
  'Add AOD index layer to Active state B and verify it has been added': function(
    client
  ) {
    client.click(selectors.addLayers);
    client.waitForElementVisible(
      selectors.aerosolOpticalDepth,
      client.globals.timeout,
      function() {
        client.click(
          '#layer-category-item-legacy-all-aerosol-index .layer-category-name'
        );
        client.waitForElementVisible(aodIndexCheckbox, client.globals.timeout, function() {
          client.click(aodIndexCheckbox);
          client.waitForElementVisible(
            '#activeB-OMI_Aerosol_Index',
            client.globals.timeout
          );
          client.expect.element(
            '#activeB-' + aodCombinedValueId
          ).to.not.be.present;
          client.expect.element(
            '#active-' + aodCombinedValueId
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
      '#active-' + aodCombinedValueId,
      client.globals.timeout,
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
