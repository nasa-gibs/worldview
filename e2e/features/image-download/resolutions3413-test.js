const { zoomIn } = require('../../reuseables/zoom')
const { bookmark } = require('../../reuseables/bookmark')
const { normalizeViewport } = require('../../reuseables/normalize-viewport')

const {
  openImageDownloadPanel,
  closeImageDownloadPanel,
  clickDownload
} = require('../../reuseables/image-download')

const startParams = [
  'p=arctic',
  'v=-4194304,-3145728,4194304,3145728',
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  't=2018-06-01',
  'imageDownload='
]

module.exports = {
  after (client) {
    client.end()
  },

  'In the arctic, top zoom levels is 5km': function (c) {
    normalizeViewport(c, 1024, 768)
    bookmark(c, startParams)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="20"]')
      .to.be.selected
    closeImageDownloadPanel(c)
  },

  'Next two zooms are 1km': function (c) {
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="4"]')
      .to.be.selected
    closeImageDownloadPanel(c)
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="4"]')
      .to.be.selected
    closeImageDownloadPanel(c)
  },

  'Next zoom is 500m': function (c) {
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="2"]')
      .to.be.selected
    closeImageDownloadPanel(c)
  },

  'Next zoom is 250m': function (c) {
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="1"]')
      .to.be.selected
    closeImageDownloadPanel(c)
    zoomIn(c)
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="1"]')
      .to.be.selected
    closeImageDownloadPanel(c)
  },

  'Last zoom level is 250m': function (c) {
    // mash the zoom button a bunch of times and see if it changes
    for (let i = 0; i < 5; i += 1) {
      zoomIn(c)
    }
    openImageDownloadPanel(c)
    c.expect.element('#wv-image-resolution option[value="1"]')
      .to.be.selected
    closeImageDownloadPanel(c)
  },

  'Click download': function (c) {
    openImageDownloadPanel(c)
    clickDownload(c)
    c.getAttribute('#wv-image-download-url', 'url', (result) => {
      // See if the bounding box here is reasonable. Should be centered
      // on 0,0 and not be wider than 20km
      const matcher = /BBOX=([^,]+),([^,]+),([^,]+),([^&]+)/
      const matches = matcher.exec(result.value)
      const x0 = Number.parseFloat(matches[1])
      const y0 = Number.parseFloat(matches[2])
      const x1 = Number.parseFloat(matches[3])
      const y1 = Number.parseFloat(matches[4])
      c.assert.ok(x0 < 0 && x0 > -20000)
      c.assert.ok(y0 < 0 && y0 > -20000)
      c.assert.ok(x1 > 0 && x1 < 20000)
      c.assert.ok(y1 > 0 && y1 < 20000)
    })
  }

}
