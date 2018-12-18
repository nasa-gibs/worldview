const TIME_LIMIT = 10000;

module.exports = {
  openImageDownloadPanel: function (c) {
    c.click('#wv-image-button');
    c.waitForElementVisible('#wv-image-button', TIME_LIMIT);
    c.pause(250);
  },

  closeImageDownloadPanel: function (c) {
    c.click('.ui-dialog.wv-image .ui-dialog-titlebar button');
    c.waitForElementNotPresent('.ui-dialog.wv-image', TIME_LIMIT);
    c.pause(250);
  },

  clickDownload: function(c) {
    c.click('.ui-dialog.wv-image .wv-image-button button');
  }
};
