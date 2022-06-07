const { loadAndSkipTour } = require('../../reuseables/skip-tour');
const {
  openImageDownloadPanel,
} = require('../../reuseables/image-download');

const TIME_LIMIT = 10000;

module.exports = {
  before(client) {
    loadAndSkipTour(client, TIME_LIMIT);
  },

  after(client) {
    client.end();
  },

  'Check that image download inputs are hidden on initial load': function(c) {
    openImageDownloadPanel(c);
    c.expect.element('.wv-image-input-title span').text.to.equal('Edit Coordinates');
    c.expect.element('.wv-image-input-subtitle').to.not.be.present;
  },
  'Check that image download extent inputs open on click': function(c) {
    c.click('.wv-image-input-title span').pause(200);
    c.waitForElementVisible('.wv-image-input-subtitle', TIME_LIMIT);
  },
  'Verify that input updates crop boundary labels ': function(c) {
    c.clearValue('#latlong-input-2');
    c.setValue('#latlong-input-2', ['-14', c.Keys.ENTER]);
    c.clearValue('#latlong-input-3');
    c.setValue('#latlong-input-3', ['14', c.Keys.ENTER]);
    c.clearValue('#latlong-input-0');
    c.setValue('#latlong-input-0', ['-40', c.Keys.ENTER]);
    c.clearValue('#latlong-input-1');
    c.setValue('#latlong-input-1', ['-20', c.Keys.ENTER]);
    c.pause(100);
    c.assert.containsText('#wv-image-top', '-14.0000');
    c.assert.containsText('#wv-image-top', '14.0000');
    c.assert.containsText('#wv-image-bottom', '-40.0000');
    c.assert.containsText('#wv-image-bottom', '-20.0000');
  },
};
