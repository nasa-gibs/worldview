const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('./selectors.js');
const localQuerystrings = require('./querystrings.js');
const animationButton = '#timeline-header #animate-button';
const ImageDownloadButton = '#wv-image-button';
const eventsTabButton = '#events-sidebar-tab';
const dataDownloadTabButton = '#download-sidebar-tab';
const ModisTruecolorLayerA =
  '#active-MODIS_Terra_CorrectedReflectance_TrueColor';
const ModisTruecolorLayerB =
  '#activeB-MODIS_Terra_CorrectedReflectance_TrueColor';
const TIME_LIMIT = 10000;
module.exports = {
  before: function(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  // load A|B and verify that it is active
  'A|B is loaded': function(client) {
    client.url(client.globals.url + localQuerystrings.swipeAndAIsActive);
    client.waitForElementVisible(localSelectors.swipeDragger, TIME_LIMIT);
  },
  'Animation, image download, data-download, and events are disabled when in A|B': function(
    client
  ) {
    // check Animation widget
    client.assert.cssClassPresent(animationButton, 'wv-disabled-button');
    client.assert.attributeContains(
      animationButton,
      'title',
      'Animation feature is deactivated when Compare feature is active'
    );
    // check image download
    client.expect.element(ImageDownloadButton + ' #wv-image-button-check').to
      .not.be.enabled;
    client.assert.attributeContains(
      ImageDownloadButton + ' label',
      'title',
      'You must exit comparison mode to use the snapshot feature'
    );
    // check events
    client.assert.cssClassPresent(eventsTabButton, 'disabled');
    client.assert.attributeContains(
      eventsTabButton,
      'title',
      'You must exit comparison mode to use the natural events feature'
    );
    // check Data Download
    client.assert.cssClassPresent(dataDownloadTabButton, 'disabled');
    client.assert.attributeContains(
      dataDownloadTabButton,
      'title',
      'You must exit comparison mode to download data'
    );
  },
  'Removing layer removes correct layer from correct layer group': function(
    client
  ) {
    client.expect.element(ModisTruecolorLayerA).to.be.visible;
    client.click('#closeactiveMODIS_Terra_CorrectedReflectance_TrueColor');
    client.pause(100);
    client.expect.element(ModisTruecolorLayerA).to.not.be.present;
    client.expect.element(ModisTruecolorLayerB).to.not.be.visible;
    client.click(localSelectors.bTab);
    client.waitForElementVisible(ModisTruecolorLayerB, TIME_LIMIT);
  },
  after: function(client) {
    client.end();
  }
};
