const skipTour = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const TIME_LIMIT = 10000;
const LAYER_TITLE = 'Total Aerosol Optical Thickness Scattering 550nm';

module.exports = {
  before: (client) => {
    skipTour.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Toggle layer Info': (client) => {
    client.click(localSelectors.infoButton);
    client.waitForElementVisible(localSelectors.infoDialog, 1000, function(e) {
      client.click(localSelectors.infoButton).pause(100);
      client.expect.element(localSelectors.infoDialog).to.not.be.present;
      client.click(localSelectors.infoButton).pause(1000);
      client.expect.element(localSelectors.infoDialog).to.be.present;
    });
  },
  'Toggle Layer Options': (client) => {
    client.click(localSelectors.optionsButton);
    client.waitForElementVisible(localSelectors.optionsDialog, 1000, function(
      e
    ) {
      client.click(localSelectors.optionsButton).pause(100);
      client.expect.element(localSelectors.optionsDialog).to.not.be.present;
      client.click(localSelectors.optionsButton).pause(1000);
      client.expect.element(localSelectors.optionsDialog).to.be.present;
    });
  },
  'Finding layer by ID with search': (client) => {
    client.click(localSelectors.addLayers);
    client.waitForElementVisible(
      localSelectors.layersSearchField,
      TIME_LIMIT,
      (e) => {
        client.setValue(
          localSelectors.layersSearchField,
          'MERRA2_Total_Aerosol_Optical_Thickness_550nm_Scattering_Monthly'
        );
        client.waitForElementVisible(
          '.search-row.layers-all-layer',
          TIME_LIMIT,
          (e) => {
            client
              .useCss()
              .assert.containsText(
                localSelectors.layersAll,
                LAYER_TITLE
              );
            client
              .useCss()
              .assert.containsText(
                localSelectors.layersAll,
                'MERRA-2'
              );
          }
        );
      }
    );
  },
  'Verify details show about selected layer are visible when selected': (client) => {
    client.waitForElementVisible('.layer-detail-container', TIME_LIMIT, (e) => {
      client
        .useCss()
        .expect.element('.layer-detail-container .layers-all-header')
        .text.contains(LAYER_TITLE);
      client
        .useCss()
        .expect.element('.source-metadata .layer-date-range').to.be.present;
    });
  },
  'Verify "Add layer" button toggles checkbox': (client) => {
    client.waitForElementVisible('.layer-detail-container', TIME_LIMIT, (e) => {
      client.click('.layer-detail-container .add-to-map-btn').pause(250);
      client
        .useCss()
        .expect.element('.search-row.layers-all-layer .wv-checkbox.checked').to.be.present;
    });
  },
  'Click back button to return to main selection': (client) => {
    client.waitForElementVisible(
      '#layer-search .back-button',
      TIME_LIMIT,
      (e) => {
        client.click('#layer-search .back-button');
        client.waitForElementVisible(
          localSelectors.aerosolOpticalDepth,
          TIME_LIMIT
        );
      }
    );
  },
  'Close Layer modal': (client) => {
    client.click(localSelectors.layersModalCloseButton).pause(2000);
    client.useCss().expect.element(localSelectors.layersAll).to.not.be.present;
  },
  'Browsing Layers by Category: Aerosol Optical Depth': (client) => {
    client.click(localSelectors.addLayers).pause(2000);
    client.click(localSelectors.aerosolOpticalDepth);
    client.waitForElementVisible(
      localSelectors.headerForAOD,
      20000,
      (e) => {
      // This is a very slow process
      /* Not found
      client.click('[aria-labelledby="accordion-legacy-all-aerosol-optical-depth"] > ul > li:nth-child(3) > a')
        .pause(1000);
        */
        client
          .useCss()
          .assert.containsText(
            '#modisterraandaquacombinedvalueaddedaerosolopticaldepth',
            'MODIS (Terra and Aqua) Combined Value-Added Aerosol Optical Depth'
          );
      });
  },
  after: (client) => {
    client.end();
  }
};
