const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const localQuerystrings = require('../../reuseables/querystrings.js');
const animationButtonCase = '#timeline-header .animate-button';
const ImageDownloadButton = '#wv-image-button';
const eventsTabButton = '#events-sidebar-tab';
const dataDownloadTabButton = '#download-sidebar-tab';
const ModisTruecolorLayerA =
  '#active-MODIS_Terra_CorrectedReflectance_TrueColor';
const ModisTruecolorLayerB =
  '#activeB-MODIS_Terra_CorrectedReflectance_TrueColor';
const toggleButton = '.toggleIconHolder .accordionToggler';
const collapsedToggleButton =
  '#productsHoldertoggleButtonHolder .accordionToggler';

const TIME_LIMIT = 20000;
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
    // Verify Animation widget can't be clicked

    /* Button is obscured by #timeline-header, class check should be enough?
    client.click(animationButton);
    client.pause(100);
    client.expect.element('#wv-animation-widget').to.not.be.visible;
    */
    client.assert.cssClassPresent(animationButtonCase, 'wv-disabled-button');
    client.assert.attributeContains(
      animationButtonCase,
      'title',
      'Animation feature is deactivated when Compare feature is active'
    );
    // Verify image download can't be clicked
    client.click(ImageDownloadButton);
    client.pause(100);
    client.expect.element('#wv-image-resolution').to.not.be.present;
    client.assert.cssClassPresent(ImageDownloadButton, 'disabled');
    client.assert.attributeContains(
      ImageDownloadButton,
      'title',
      'You must exit comparison mode to use the snapshot feature'
    );
    // Verify events can't be clicked
    client
      .moveToElement(eventsTabButton, 1, 1)
      .mouseButtonDown(0)
      .pause(100);
    client.expect.element('#wv-eventscontent').to.not.be.visible;
    client.assert.cssClassPresent(eventsTabButton, 'disabled');
    client.assert.attributeContains(
      eventsTabButton,
      'title',
      'You must exit comparison mode to use the natural events feature'
    );
    // Verify Data Download can't be clicked
    client
      .moveToElement(dataDownloadTabButton, 1, 1)
      .mouseButtonDown(0)
      .pause(100);
    client.pause(100);
    client.expect.element('#wv-datacontent').to.not.be.visible;
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
    client.expect.element(ModisTruecolorLayerB).to.not.be.present;
    client.click(localSelectors.bTab);
    client.waitForElementVisible(ModisTruecolorLayerB, TIME_LIMIT);
  },
  /**
   * B state can layer list collapse
   */
  'Collapse layer list with B state and test label shows correct number of layers': function(
    client
  ) {
    client.url(client.globals.url + localQuerystrings.spyAndBIsActive);

    client.waitForElementVisible(toggleButton, TIME_LIMIT, function() {
      client.expect.element(collapsedToggleButton).to.not.be.visible;
      client.click(toggleButton);
      client.pause(100);
      client.expect.element(collapsedToggleButton).to.be.visible;
      client.waitForElementNotPresent(toggleButton, TIME_LIMIT);
      client.useCss().assert.containsText(collapsedToggleButton, '6');
      client.click(collapsedToggleButton);
      client.pause(100);
      client.waitForElementVisible('#activeB-Reference_Features', TIME_LIMIT);
    });
  },
  /**
   * Remove some layers from active state B and then toggle out of A|B mode to verify
   * that layer-sidebar inherits B state layers
   */
  'If you exit A|B with B selection active, the active state will then be the B state': function(
    client
  ) {
    client.expect.element('#activeB-VIIRS_SNPP_CorrectedReflectance_TrueColor')
      .to.be.visible;
    client.expect.element('#activeB-MODIS_Aqua_CorrectedReflectance_TrueColor')
      .to.be.visible;
    client.click('#closeactiveBReference_Labels');
    client.click('#closeactiveBReference_Features');
    client.click('#closeactiveBVIIRS_SNPP_CorrectedReflectance_TrueColor');
    client.click('#closeactiveBMODIS_Aqua_CorrectedReflectance_TrueColor');
    client.pause(1000);
    client.click(localSelectors.compareButton);
    client.waitForElementNotPresent(
      '.timeline-dragger.draggerA',
      TIME_LIMIT,
      function() {
        client.expect.element('#activeB-Coastlines').to.be.visible;
        client.expect.element(
          '#activeB-MODIS_Terra_CorrectedReflectance_TrueColor'
        ).to.be.visible;
        client.expect.element(
          '#activeB-VIIRS_SNPP_CorrectedReflectance_TrueColor'
        ).to.not.be.present;
        client.expect.element(
          '#activeB-MODIS_Aqua_CorrectedReflectance_TrueColor'
        ).to.not.be.present;
      }
    );
  },
  after: function(client) {
    client.end();
  }
};
