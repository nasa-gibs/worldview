const { zoomIn, zoomOut } = require('../../reuseables/zoom');
const { bookmark } = require('../../reuseables/bookmark');
const { normalizeViewport } = require('../../reuseables/normalize-viewport');
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload,
} = require('../../reuseables/image-download');

const startParams = [
  'p=geographic',
  'v=-180,-90,180,90',
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  't=2018-06-01',
  'imageDownload=',
];

const globalSelectInput = '#image-global-cb';
module.exports = {
  after(client) {
    client.end();
  },
  'Verify that global select is present and not selected': function(c) {
    normalizeViewport(c, 1024, 768);
    bookmark(c, startParams);
    openImageDownloadPanel(c);
    c.expect.element(globalSelectInput).to.be.present;
    c.expect.element(globalSelectInput).to.not.be.selected;
  },

  'Verify that checking checkbox updates bounding-box labels': function(c) {
    c.expect.element('#wv-image-top').text.to.not.contain('180.0000');
    c.click(globalSelectInput);
    c.expect.element('#wv-image-top').text.to.contain('180.0000');
  },
  'Verify that checkbox is gone after zoom and bounding box is no longer around globe': function(c) {
    closeImageDownloadPanel(c);
    zoomIn(c);
    openImageDownloadPanel(c);
    c.expect.element(globalSelectInput).to.not.be.present;
    c.expect.element('#wv-image-top').text.to.not.contain('180.0000');
  },
  'Verify that checkbox is back after zooming back out': function(c) {
    closeImageDownloadPanel(c);
    zoomOut(c);
    openImageDownloadPanel(c);
    c.expect.element(globalSelectInput).to.be.present;
  },
};
