const { bookmark } = require('../../reuseables/bookmark')
const { normalizeViewport } = require('../../reuseables/normalize-viewport')
const {
  openImageDownloadPanel
} = require('../../reuseables/image-download')

const startParams = [
  'p=geographic',
  'v=-180,-90,180,90',
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  't=2018-06-01',
  'imageDownload='
]

const globalSelectInput = '#image-global-cb'
module.exports = {
  after (client) {
    client.end()
  },
  'Verify that global select is present and not selected': function (c) {
    normalizeViewport(c, 1024, 768)
    bookmark(c, startParams)
    openImageDownloadPanel(c)
    c.expect.element(globalSelectInput).to.be.present
    c.expect.element(globalSelectInput).to.not.be.selected
  },
  'Verify that checking checkbox updates bounding-box labels': function (c) {
    c.expect.element('#wv-image-top').text.to.not.contain('180.0000')
    c.click(globalSelectInput)
    c.pause(500)
    c.expect.element('#wv-image-top').text.to.contain('180.0000')
    c.expect.element('#wv-image-bottom').text.to.contain('180.0000')
    c.pause(500)
  },
  'Verify that unchecking checkbox updates bounding-box to previous': function (c) {
    c.click(globalSelectInput)
    c.pause(500)
    c.expect.element('#wv-image-top').text.to.not.contain('180.0000')
    c.expect.element('#wv-image-top').text.to.contain('35.1563')
    c.expect.element('#wv-image-bottom').text.to.contain('35.1563')
    c.pause(2000)
  }
}
