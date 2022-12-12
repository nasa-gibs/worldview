const { bookmark } = require('../../reuseables/bookmark')

const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload
} = require('../../reuseables/image-download')

const startParams = [
  'imageDownload='
]

module.exports = {
  after (client) {
    client.end()
  },

  'Image for today': function (c) {
    bookmark(c, startParams.concat(['now=2018-06-01T3']))
    openImageDownloadPanel(c)
    clickDownload(c)
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.to.contain('TIME=2018-06-01')
    closeImageDownloadPanel(c)
  },

  // Don't show 'today' until three hours after (when the latency
  // catches up)
  'Image for yesterday': function (c) {
    bookmark(c, startParams.concat(['now=2018-06-01T0']))
    openImageDownloadPanel(c)
    clickDownload(c)
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.to.contain('TIME=2018-05-31')
    closeImageDownloadPanel(c)
  },

  'Image for 2018-05-15': function (c) {
    bookmark(c, startParams.concat(['t=2018-05-15']))
    openImageDownloadPanel(c)
    clickDownload(c)
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.to.contain('TIME=2018-05-15')
    closeImageDownloadPanel(c)
  }

}
