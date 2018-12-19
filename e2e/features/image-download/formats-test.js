const { switchProjection } = require('../../reuseables/switch-projection');
const { bookmark } = require('../../reuseables/bookmark');
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload
} = require('../../reuseables/image-download');

const startParams = [
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  'v=-1,-1,1,1',
  't=2018-06-01',
  'imageDownload='
];

module.exports = {
  after: function(client) {
    client.end();
  },

  'JPEG is the default': function(c) {
    bookmark(c, startParams);
    openImageDownloadPanel(c);
    clickDownload(c);
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.to.contain('FORMAT=image/jpeg');
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.not.to.contain('WORLDFILE');
    closeImageDownloadPanel(c);
  },

  'Add a worldfile': function(c) {
    openImageDownloadPanel(c);
    c.click('#wv-image-worldfile option[value="true"]');
    clickDownload(c);
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.to.contain('WORLDFILE=true');
    c.click('#wv-image-worldfile option[value="false"]');
    closeImageDownloadPanel(c);
  },

  'Select PNG': function(c) {
    openImageDownloadPanel(c);
    c.click('#wv-image-format option[value="image/png"]');
    clickDownload(c);
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .contain('FORMAT=image/png');
    closeImageDownloadPanel(c);
  },

  'Swtich to arctic, is PNG': function(c) {
    switchProjection(c, 'arctic');
    openImageDownloadPanel(c);
    clickDownload(c);
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .contain('FORMAT=image/png');
    closeImageDownloadPanel(c);
  },

  'Switch to geographic, select KMZ, switch to arctic, is PNG': function(c) {
    switchProjection(c, 'geographic');
    openImageDownloadPanel(c);
    c.click('#wv-image-format option[value="application/vnd.google-earth.kmz"]');
    closeImageDownloadPanel(c);
    switchProjection(c, 'arctic');
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .contain('FORMAT=image/png');
  }
};
