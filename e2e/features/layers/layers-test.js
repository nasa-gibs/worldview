const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('./selectors.js');
const TIME_LIMIT = 10000;

module.exports = {
  before: function (client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Toggle layer Info': function(client) {
    client.click(localSelectors.infoButton);
    client.waitForElementVisible(localSelectors.infoDialog, 1000, function(e) {
      client.click(localSelectors.infoButton)
        .pause(100);
      client.expect.element(localSelectors.infoDialog).to.not.be.present;
      client.click(localSelectors.infoButton)
        .pause(1000);
      client.expect.element(localSelectors.infoDialog).to.be.present;
    });
  },
  'Toggle Layer Options': function(client) {
    client.click(localSelectors.optionsButton);
    client.waitForElementVisible(localSelectors.optionsDialog, 1000, function(e) {
      client.click(localSelectors.optionsButton)
        .pause(100);
      client.expect.element(localSelectors.optionsDialog).to.not.be.present;
      client.click(localSelectors.optionsButton)
        .pause(1000);
      client.expect.element(localSelectors.optionsDialog).to.be.present;
    });
  },
  'Finding VIIRs Corrected Reflectance layer with search': function(client) {
    client
      .click(localSelectors.addLayers);
    client.waitForElementVisible(localSelectors.layersSearchField, TIME_LIMIT, function(e) {
      client.setValue(localSelectors.layersSearchField, 'VIIRS_SNPP_Corrected');
      client.waitForElementVisible(localSelectors.sourceInfoIcon, TIME_LIMIT, function(e) {
        client.useCss().assert.containsText(localSelectors.layersAll, 'Corrected Reflectance (True Color)');
        client.useCss().assert.containsText(localSelectors.layersAll, 'Suomi NPP / VIIRS');
      });
    });
  },
  'Verify Corrected Reflectance Layer is selected': function(client) {
    client.assert.cssClassPresent(localSelectors.layerHeader, 'checked');
  },
  'Open And Close info about Layer found in search': function(client) {
    client.useCss().expect.element(localSelectors.layersAll).text.not.contains('VIIRS Corrected Reflectance');
    client
      .click(localSelectors.sourceInfoIcon)
      .pause(2000);
    client.useCss().assert.containsText(localSelectors.layersAll, 'VIIRS Corrected Reflectance');
    client.useCss().moveToElement(localSelectors.sourceMetadataCloseButton, 10, 10);
    client.click(localSelectors.sourceMetadataCloseButton);
    client.useCss().expect.element(localSelectors.layersAll).text.not.contains('VIIRS Corrected Reflectance');
  },
  'Close Layer modal': function(client) {
    client.click(localSelectors.layersModalCloseButton)
      .pause(2000);
    client.useCss().expect.element(localSelectors.layersAll).to.not.be.visible;
  },
  'Open Layer modal and click breadcrumb to return to main selection': function(client) {
    client.click(localSelectors.addLayers);
    client.waitForElementVisible(localSelectors.backToCategories, TIME_LIMIT, function(e) {
      client.click(localSelectors.backToCategories);
      client.waitForElementVisible(localSelectors.aerosolOpticalDepth, TIME_LIMIT);
    });
  },
  'Browsing Layers by Category: Aerosol Optical Depth': function(client) {
    client.click(localSelectors.aerosolOpticalDepth);
    client.waitForElementVisible(localSelectors.headerForAOD, 20000, function(e) { // This is a very slow process
      client.click('#ui-accordion-legacy-all-list-panel-0 > ul > li:nth-child(3) > a')
        .pause(1000);
      client.useCss().assert.containsText('#modis-terra-and-aqua-combined-value-added-aerosol-optical-depth', 'MODIS (Terra and Aqua) Combined Value-Added Aerosol Optical Depth');
    });
  },
  after: function(client) {
    client.end();
  }
};
