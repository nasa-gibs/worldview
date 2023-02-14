const { zoomIn } = require('../../reuseables/zoom')
const { bookmark } = require('../../reuseables/bookmark')
const { normalizeViewport } = require('../../reuseables/normalize-viewport')
const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload
} = require('../../reuseables/image-download')

const startParams = [
  'p=geographic',
  'v=-180,-90,180,90',
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  't=2018-06-01',
  'imageDownload='
]

module.exports = {
  after (client) {
    client.end()
  },

  'In geographic, top two zoom levels are 10km': function (c) {
    normalizeViewport(c, 1024, 768)
    bookmark(c, startParams)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="40"]').to.be.selected
    closeImageDownloadPanel(c)
    zoomIn(c)
    openImageDownloadPanel(c)

    c.expect.element('#wv-image-resolution option[value="40"]').to.be.selected
    closeImageDownloadPanel(c)
  },

  'Next zoom is 5km': function (c) {
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="20"]').to.be.selected
    closeImageDownloadPanel(c)
  },

  'Next two zooms are 1km': function (c) {
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="4"]').to.be.selected
    closeImageDownloadPanel(c)
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="4"]').to.be.selected
    closeImageDownloadPanel(c)
  },

  'Next zoom is 500m': function (c) {
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="2"]').to.be.selected
    closeImageDownloadPanel(c)
  },

  'Next two zooms are 250m': function (c) {
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="1"]').to.be.selected
    closeImageDownloadPanel(c)
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="1"]').to.be.selected
    closeImageDownloadPanel(c)
  },

  'Next zoom is 125m': function (c) {
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="0.5"]').to.be.selected
    closeImageDownloadPanel(c)
  },

  'Next zoom is 60m': function (c) {
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="0.25"]').to.be
      .selected
    closeImageDownloadPanel(c)
  },

  'Next zoom is 30m': function (c) {
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="0.125"]').to.be
      .selected
    closeImageDownloadPanel(c)
  },

  'Last zoom level is 30m': function (c) {
    // mash the zoom button a bunch of times and see if it changes
    for (let i = 0; i < 5; i += 1) {
      zoomIn(c)
    }
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="0.125"]').to.be
      .selected
    closeImageDownloadPanel(c)
  },

  'Click download': function (c) {
    openImageDownloadPanel(c)
    clickDownload(c)
    c.getAttribute('#wv-image-download-url', 'url', (result) => {
      // See if the bounding box here is reasonable. Should be centered
      // on 0,0 and not be wider than 0.1 degrees
      const matcher = /BBOX=([^,]+),([^,]+),([^,]+),([^&]+)/
      const matches = matcher.exec(result.value)
      const lat0 = Number.parseFloat(matches[1])
      const lon0 = Number.parseFloat(matches[2])
      const lat1 = Number.parseFloat(matches[3])
      const lon1 = Number.parseFloat(matches[4])
      c.assert.ok(lat0 < 0 && lat0 > -0.1)
      c.assert.ok(lon0 < 0 && lon0 > -0.1)
      c.assert.ok(lat1 > 0 && lat1 < 0.1)
      c.assert.ok(lon1 > 0 && lon1 < 0.1)
    })
  }
}
