const { switchProjection } = require('../../reuseables/switch-projection')
const { bookmark } = require('../../reuseables/bookmark')
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload
} = require('../../reuseables/image-download')

const startParams = [
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  't=2018-06-01',
  'imageDownload='
]

module.exports = {
  after (client) {
    client.end()
  },

  'Geographic is EPSG:4326': function (c) {
    bookmark(c, startParams)
    openImageDownloadPanel(c)
    clickDownload(c)
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.to.contain('CRS=EPSG:4326')
    closeImageDownloadPanel(c)
  },

  'Arctic is EPSG:3413': function (c) {
    switchProjection(c, 'arctic')
    openImageDownloadPanel(c)
    clickDownload(c)
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.to.contain('CRS=EPSG:3413')
    closeImageDownloadPanel(c)
  },

  'Antarctic is EPSG:3031': function (c) {
    switchProjection(c, 'antarctic')
    openImageDownloadPanel(c)
    clickDownload(c)
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.to.contain('CRS=EPSG:3031')
    closeImageDownloadPanel(c)
  }
}
