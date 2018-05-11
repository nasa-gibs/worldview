const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('./selectors.js');
const localQuerystrings = require('./querystrings.js');
const TIME_LIMIT = 30000; // Sometimes takes a while to generate GIFs
const askDialog = '.wv-dialog-ask';
const askDialogOkButton = 'body > div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-front.ui-dialog-buttons.ui-draggable > div.ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix > div > button:nth-child(2) > span';

module.exports = {
  before: function (client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Downloading GIF opens Ask Dialog before resetting colormap when custom colormap is activated': function(client) {
    if (client.options.desiredCapabilities.browser !== 'ie') { // Custom colormaps don't exist in IE
      client.url(client.globals.url + localQuerystrings.activeCustomColormap);
      client.waitForElementVisible(localSelectors.animationWidget, TIME_LIMIT, function() {
        client.click(localSelectors.createGifIcon)
          .pause(1000);
        client.click(localSelectors.gifDownloadIcon)
          .pause(1000);
        client.expect.element(askDialog).to.be.present;
        client.useCss().click(askDialogOkButton);
        client.waitForElementVisible(localSelectors.gifResults, TIME_LIMIT, function() {
          client.click(localSelectors.gifResultsCloseButton);
          client.expect.element(localSelectors.gifResults).to.not.be.present;
          client.waitForElementVisible(localSelectors.animationWidget, TIME_LIMIT);
        });
      });
    }
  },
  'Downloading GIF opens Ask Dialog before reseting rotation when polar projection is rotated': function(client) {
    const globalSelectors = client.globals.selectors;
    client.url(client.globals.url + localQuerystrings.animationProjectionRotated);
    client.waitForElementVisible(localSelectors.animationWidget, TIME_LIMIT, function() {
      client.click(localSelectors.createGifIcon)
        .pause(1000);
      client.click(localSelectors.gifDownloadIcon)
        .pause(1000);
      client.useCss().assert.containsText(globalSelectors.clearRotationButton, '-18');
      client.expect.element(askDialog).to.be.present;
      client.useCss().click(askDialogOkButton)
        .pause(1000);
      client.useCss().assert.containsText(globalSelectors.clearRotationButton, '0');
    });
  },
  'GIF selection preview is Accurate when first loaded': function(client) {
    client.url(client.globals.url + localQuerystrings.activeAnimationWidget);
    client.waitForElementVisible(localSelectors.animationWidget, TIME_LIMIT, function() {
      client.click(localSelectors.createGifIcon)
        .pause(1000);
      client.waitForElementVisible(localSelectors.createGifButton, TIME_LIMIT, function() {
        client.useCss().assert.containsText(localSelectors.gifPreviewStartDate, '2018-03-28');
        client.useCss().assert.containsText(localSelectors.gifPreviewEndDate, '2018-04-04');
        client.useCss().assert.containsText(localSelectors.gifPreviewFrameRateValue, '3 Frames Per Second');
        client.assert.ok('#wv-checkbox-gif'); // checkbox is checked
      });
    });
  },
  'GIF selections that are too high disable GIF download': function(client) {
    client.click(localSelectors.gifPreviewEndResolutionOption250)
      .pause(1000);
    client.assert.value(localSelectors.gifPreviewEndResolutionSelector, '1');
    client.expect.element(localSelectors.gifDownloadButton).to.not.be.enabled;
  },
  after: function(client) {
    client.end();
  }
};
