const { bookmark } = require('../../reuseables/bookmark');
const { closeImageDownloadPanel } = require('../../reuseables/image-download');

const startParams = [
  'v=-180,-90,180,90',
  't=2018-06-01',
  'imageDownload='
];

const TIME_WAIT = 10000;

module.exports = {
  after: function(client) {
    client.end();
  },

  'Custom palettes are not supported dialog': function(c) {
    bookmark(c, startParams.concat(['l=MODIS_Terra_Aerosol(palette=red_1)']));
    c.click('#wv-image-button');
    c.waitForElementVisible('.wv-dialog-ask', TIME_WAIT);
  },

  'Custom palettes: Cancel button': function(c) {
    c.click('.ui-dialog .ui-dialog-buttonset button:nth-of-type(1)');
    c.waitForElementNotVisible('.wv-dialog-ask', TIME_WAIT);
    c.expect.element('.ui-dialog.wv-image').to.not.be.present;
  },

  'Custom palettes: OK button brings up download panel': function(c) {
    // FIXME: Dialog doesn't clean up properly and there will be more than
    // one. Go ahead and remove all dialog elements first.
    c.execute(function() {
      let elements = document.querySelectorAll('.ui-dialog');
      elements.forEach((e) => e.parentNode.removeChild(e));
    });
    c.click('#wv-image-button');
    c.waitForElementVisible('.wv-dialog-ask', TIME_WAIT);
    c.click('.ui-dialog .ui-dialog-buttonset button:nth-of-type(2)');
    c.waitForElementNotVisible('.wv-dialog-ask', TIME_WAIT);
    c.waitForElementPresent('.ui-dialog.wv-image', TIME_WAIT);
    c.pause(500);
    closeImageDownloadPanel(c);
  },

  'Rotation is not supported dialog': function(c) {
    bookmark(c, startParams.concat(['p=arctic', 'r=18']));
    c.click('#wv-image-button');
    c.waitForElementVisible('.wv-dialog-ask', TIME_WAIT);
  },

  'Rotation: Cancel button': function(c) {
    c.click('.ui-dialog .ui-dialog-buttonset button:nth-of-type(1)');
    c.waitForElementNotVisible('.wv-dialog-ask', TIME_WAIT);
    c.expect.element('.ui-dialog.wv-image').to.not.be.present;
  },

  'Rotation: OK button brings up download panel': function(c) {
    // FIXME: Dialog doesn't clean up properly and there will be more than
    // one. Go ahead and remove all dialog elements first.
    c.execute(function() {
      let elements = document.querySelectorAll('.ui-dialog');
      elements.forEach((e) => e.parentNode.removeChild(e));
    });
    c.click('#wv-image-button');
    c.waitForElementVisible('.wv-dialog-ask', TIME_WAIT);
    c.click('.ui-dialog .ui-dialog-buttonset button:nth-of-type(2)');
    c.waitForElementNotVisible('.wv-dialog-ask', TIME_WAIT);
    c.waitForElementPresent('.ui-dialog.wv-image', TIME_WAIT);
    c.pause(500);
    closeImageDownloadPanel(c);
  }
};
