const { bookmark } = require('../../reuseables/bookmark')
const { closeImageDownloadPanel } = require('../../reuseables/image-download')

const startParams = ['v=-180,-90,180,90', 't=2018-06-01', 'imageDownload=']

const TIME_WAIT = 10000

module.exports = {
  after (client) {
    client.end()
  },

  'Custom palettes are not supported dialog': function (c) {
    bookmark(c, startParams.concat(['l=MODIS_Terra_Aerosol(palette=red_1)']))
    c.click('#wv-image-button')
    c.waitForElementVisible('.notify', TIME_WAIT)
  },

  'Custom palettes: Cancel button': function (c) {
    c.click('.cancel-notify')
    c.pause(1000)
    c.expect.element('.notify').to.not.be.present
    c.expect.element('#toolbar_snapshot').to.not.be.present
  },

  'Custom palettes: OK button brings up download panel': function (c) {
    c.click('#wv-image-button')
    c.waitForElementVisible('.notify', TIME_WAIT)
    c.click('.accept-notify')
    c.pause(1000)
    c.expect.element('.notify').to.not.be.present
    c.waitForElementPresent('#toolbar_snapshot', TIME_WAIT)
    c.pause(500)
    closeImageDownloadPanel(c)
  },

  'Rotation is not supported dialog': function (c) {
    bookmark(c, startParams.concat(['p=arctic', 'r=18']))
    c.click('#wv-image-button')
    c.waitForElementVisible('.notify', TIME_WAIT)
  },

  'Rotation: Cancel button': function (c) {
    c.click('.cancel-notify')
    c.pause(1000)
    c.expect.element('.notify').to.not.be.present
    c.expect.element('#toolbar_snapshot').to.not.be.present
  },

  'Rotation: OK button brings up download panel': function (c) {
    c.click('#wv-image-button')
    c.waitForElementVisible('.notify', TIME_WAIT)
    c.click('.accept-notify')
    c.pause(1000)
    c.expect.element('.notify').to.not.be.present
    c.waitForElementPresent('#toolbar_snapshot', TIME_WAIT)
    c.pause(500)
    closeImageDownloadPanel(c)
  }
}
