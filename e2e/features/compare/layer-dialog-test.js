const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const localQuerystrings = require('../../reuseables/querystrings.js');
const TIME_LIMIT = 20000;
const aerosolLayer = '#active-MODIS_Terra_Aerosol';
const AodOptionsPanelBody =
  '#layer_options_modal-modis_terra_aerosol .modal-body';
const AodOptionsPanelHeader =
  '#layer_options_modal-modis_terra_aerosol .modal-header';
const AodInfoPanel = '.layer_info_modal-modis_terra_aerosol';
const correctedReflectanceBLayer =
  '#activeB-MODIS_Terra_CorrectedReflectance_TrueColor';
const correctedReflectanceOptionsPanelHeader =
  '#layer_options_modal-modis_terra_correctedreflectance_truecolor .modal-header';
const correctedReflectanceOptionsPanelBody =
  '#layer_options_modal-modis_terra_correctedreflectance_truecolor .modal-body';
const correctedReflectanceInfoPanel =
  '#layer_info_modal-modis_terra_correctedreflectance_truecolor';

module.exports = {
  before: function(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Layer option features work in A|B mode': function(client) {
    client.url(client.globals.url + localQuerystrings.swipeAOD);

    client.waitForElementVisible(aerosolLayer, TIME_LIMIT, function() {
      client.expect.element(AodOptionsPanelBody).to.not.be.present;
      client.click(aerosolLayer + ' .wv-layers-options');
      client.waitForElementVisible(
        '.layer-settings-modal',
        TIME_LIMIT,
        function() {
          client.pause(1000);
          client
            .useCss()
            .assert.containsText(
              AodOptionsPanelHeader + ' .modal-title',
              'Aerosol Optical Depth'
            );
          if (client.options.desiredCapabilities.browser !== 'ie') {
            client.expect.element(AodOptionsPanelBody + ' .wv-palette-selector')
              .to.be.visible;
          }
        }
      );
    });
  },
  'Layer info dialog works in A|B mode': function(client) {
    client.click(AodOptionsPanelHeader + ' .close').pause(1000);
    client.click(aerosolLayer + ' .wv-layers-info');
    client.waitForElementVisible(
      AodInfoPanel + ' .layer-description',
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
    client.click(AodInfoPanel + ' .close').pause(1000);
    client.click(localSelectors.compareButton);
    client.waitForElementVisible(aerosolLayer, TIME_LIMIT, function() {
      client.expect.element(AodOptionsPanelBody).to.not.be.present;
    });
  },
  'Layer option features after exiting A|B mode': function(client) {
    client.click(aerosolLayer + ' .wv-layers-options');
    client.waitForElementVisible(AodOptionsPanelBody, TIME_LIMIT, function() {
      client
        .useCss()
        .assert.containsText(
          AodOptionsPanelHeader + ' .modal-title',
          'Aerosol Optical Depth'
        );
      if (client.options.desiredCapabilities.browser !== 'ie') {
        client.expect.element(AodOptionsPanelBody + ' .wv-palette-selector').to
          .be.visible;
      }
    });
  },
  'Layer info dialog works after exiting A|B mode': function(client) {
    client.click(AodOptionsPanelHeader + ' .close').pause(1000);
    client.click(aerosolLayer + ' .wv-layers-info');
    client.waitForElementVisible(
      AodInfoPanel + ' .layer-description',
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
    client.click(AodInfoPanel + ' .close').pause(1000);
    client.click(aerosolLayer + ' .wv-layers-options').pause(1000);
    client.click(AodOptionsPanelHeader + ' .close').pause(1000);
    client.click(localSelectors.compareButton);
    client.waitForElementVisible(aerosolLayer, TIME_LIMIT, function() {
      client.pause(1000);
      client.expect.element(AodOptionsPanelBody).to.not.be.present;
      client.click(localSelectors.bTab);
    });
  },
  'Layer option features work in B state': function(client) {
    client.waitForElementVisible(
      correctedReflectanceBLayer,
      TIME_LIMIT,
      function() {
        client.expect.element(AodOptionsPanelBody).to.not.be.present;
        client.click(correctedReflectanceBLayer + ' .wv-layers-options');
        client.waitForElementVisible(
          '.layer-settings-modal',
          TIME_LIMIT,
          function() {
            client
              .useCss()
              .assert.containsText(
                correctedReflectanceOptionsPanelHeader + ' .modal-title',
                'Corrected Reflectance (True Color)'
              );
            if (client.options.desiredCapabilities.browser !== 'ie') {
              client.expect.element(
                correctedReflectanceOptionsPanelBody + ' .wv-palette-selector'
              ).to.not.be.present;
            }
          }
        );
      }
    );
  },
  'Layer info dialog works after clicking into B mode': function(client) {
    client.click(correctedReflectanceOptionsPanelHeader + ' .close');
    client.waitForElementNotPresent('#layer_options_modal-modis_terra_correctedreflectance_truecolor .modal-header', TIME_LIMIT);
    client.click(correctedReflectanceBLayer + ' .wv-layers-info');
    client.pause(500);
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
