const TIME_LIMIT = 10000;

module.exports = {
  openImageDownloadPanel: function(c) {
    c.waitForElementVisible('#wv-image-button', TIME_LIMIT);
    c.click('#wv-image-button');
    c.pause(250);
  },

  closeImageDownloadPanel: function(c) {
    c.click('#toolbar_snapshot .close');
    c.waitForElementNotPresent('#toolbar_snapshot', TIME_LIMIT);
    c.pause(250);
  },

  clickDownload: function(c) {
    c.click(' .wv-image-button .wv-button');
  }
};
