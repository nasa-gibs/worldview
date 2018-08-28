const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('./selectors.js');
const localQuerystrings = require('./querystrings.js');
const TIME_LIMIT = 10000;
const aerosolLayer = '#active-MODIS_Terra_Aerosol';
const AodOptionsPanel = '.wv-options-panel-MODIS_Terra_Aerosol';
const AodInfoPanel = '.wv-info-panel-MODIS_Terra_Aerosol';
const correctedReflectanceBLayer =
  '#activeB-MODIS_Terra_CorrectedReflectance_TrueColor';
const correctedReflectanceOptionsPanel =
  '.wv-options-panel-MODIS_Terra_CorrectedReflectance_TrueColor';
const correctedReflectanceInfoPanel =
  '.wv-info-panel-MODIS_Terra_CorrectedReflectance_TrueColor';

module.exports = {
  before: function(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Layer option features work in A|B mode': function(client) {
    client.url(client.globals.url + localQuerystrings.swipeAOD);

    client.waitForElementVisible(aerosolLayer, TIME_LIMIT, function() {
      client.expect.element(AodOptionsPanel).to.not.be.present;
      client.click(aerosolLayer + ' .wv-layers-options');
      client.waitForElementVisible(
        '#wv-layers-options-dialog',
        TIME_LIMIT,
        function() {
          client
            .useCss()
            .assert.containsText(
              AodOptionsPanel + ' .ui-dialog-title',
              'Aerosol Optical Depth'
            );
          if (client.options.desiredCapabilities.browser !== 'ie') {
            client.expect.element(AodOptionsPanel + ' #wv-palette-selector').to
              .be.visible;
          }
        }
      );
    });
  },
  'Layer info dialog works in A|B mode': function(client) {
    client.click(aerosolLayer + ' .wv-layers-info');
    client.waitForElementVisible(
      AodInfoPanel + ' .layer-metadata',
      TIME_LIMIT,
      function() {
        client
          .useCss()
          .assert.containsText(
            AodInfoPanel,
            'The Aerosol Optical Depth layer is useful for studying aerosol optical depth'
          );
      }
    );
  },
  'expect clicking A|B button to close options dialog': function(client) {
    client.click(localSelectors.compareButton);
    client.waitForElementVisible(aerosolLayer, TIME_LIMIT, function() {
      client.expect.element(AodOptionsPanel).to.not.be.present;
    });
  },
  'Layer option features after exiting A|B mode': function(client) {
    client.click(aerosolLayer + ' .wv-layers-options');
    client.waitForElementVisible(AodOptionsPanel, TIME_LIMIT, function() {
      client
        .useCss()
        .assert.containsText(
          AodOptionsPanel + ' .ui-dialog-title',
          'Aerosol Optical Depth'
        );
      if (client.options.desiredCapabilities.browser !== 'ie') {
        client.expect.element(AodOptionsPanel + ' #wv-palette-selector').to.be
          .visible;
      }
    });
  },
  'Layer info dialog works after exiting A|B mode': function(client) {
    client.click(aerosolLayer + ' .wv-layers-info');
    client.waitForElementVisible(
      AodInfoPanel + ' .layer-metadata',
      TIME_LIMIT,
      function() {
        client
          .useCss()
          .assert.containsText(
            AodInfoPanel,
            'The Aerosol Optical Depth layer is useful for studying aerosol optical depth'
          );
      }
    );
  },
  'expect reactivating A|B to close options dialog and activate B state': function(
    client
  ) {
    client.click(localSelectors.compareButton);
    client.waitForElementVisible(aerosolLayer, TIME_LIMIT, function() {
      client.expect.element(AodOptionsPanel).to.not.be.present;
      client.click(localSelectors.bTab);
    });
  },
  'Layer option features work in B state': function(client) {
    client.waitForElementVisible(
      correctedReflectanceBLayer,
      TIME_LIMIT,
      function() {
        client.expect.element(AodOptionsPanel).to.not.be.present;
        client.click(correctedReflectanceBLayer + ' .wv-layers-options');
        client.waitForElementVisible(
          '#wv-layers-options-dialog',
          TIME_LIMIT,
          function() {
            client
              .useCss()
              .assert.containsText(
                correctedReflectanceOptionsPanel + ' .ui-dialog-title',
                'Corrected Reflectance (True Color)'
              );
            if (client.options.desiredCapabilities.browser !== 'ie') {
              client.expect.element(
                correctedReflectanceOptionsPanel + ' #wv-palette-selector'
              ).to.not.be.present;
            }
          }
        );
      }
    );
  },
  'Layer info dialog works after clicking into B mode': function(client) {
    client.click(correctedReflectanceBLayer + ' .wv-layers-info');
    client.waitForElementVisible(
      correctedReflectanceInfoPanel + ' .layer-metadata',
      TIME_LIMIT,
      function() {
        client
          .useCss()
          .assert.containsText(
            correctedReflectanceInfoPanel,
            'These images are called true-color or natural color because this combination of wavelengths is similar to what the human eye'
          );
      }
    );
  },
  after: function(client) {
    client.end();
  }
};
