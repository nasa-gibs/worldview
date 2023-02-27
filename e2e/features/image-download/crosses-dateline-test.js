const { normalizeViewport } = require('../../reuseables/normalize-viewport')
const {
  openImageDownloadPanel
} = require('../../reuseables/image-download')

const TIME_LIMIT = 10000

const datelineAlert = '#snapshot-dateline-alert'
const datelineAlertMessage = '#snapshot-dateline-alert .wv-alert-message'

const withinMapURLParams = '?v=-67.80916012733559,-56.052180562072095,-30.50743102883792,-30.873513420586164&t=2021-08-08-T0'
const crossesPrevDayURLParams = '?v=161.16767164758798,-54.46571918482002,198.46940074608565,-29.287052043334096&t=2021-08-08-T0'
const crossesNextDayURLParams = '?v=-198.76946733086245,-59.504883811673906,-161.46773823236478,-34.326216670187975&t=2021-08-08-T0'

module.exports = {
  after (client) {
    client.end()
  },

  'No dateline alert notification with message if not crossing dateline(s)': (c) => {
    normalizeViewport(c, 1024, 768)
    c.url(c.globals.url + withinMapURLParams)
    openImageDownloadPanel(c)
    c.pause(500)

    c.expect.element(datelineAlert).to.not.be.present
  },

  'Dateline alert notification with previous day message if crosses previous day dateline': (c) => {
    normalizeViewport(c, 1024, 768)
    c.url(c.globals.url + crossesPrevDayURLParams)
    openImageDownloadPanel(c)
    c.pause(500)

    c.expect.element(datelineAlert).to.be.present
    c.waitForElementVisible(datelineAlertMessage, TIME_LIMIT, (e) => {
      c.assert.containsText(datelineAlertMessage, 'The selected snapshot area crosses the dateline and uses imagery from the previous day 2021 AUG 07.')
    })
  },

  'Dateline alert notification with next day message if crosses next day dateline': (c) => {
    normalizeViewport(c, 1024, 768)
    c.url(c.globals.url + crossesNextDayURLParams)
    openImageDownloadPanel(c)
    c.pause(500)

    c.expect.element(datelineAlert).to.be.present
    c.waitForElementVisible(datelineAlertMessage, TIME_LIMIT, (e) => {
      c.assert.containsText(datelineAlertMessage, 'The selected snapshot area crosses the dateline and uses imagery from the next day 2021 AUG 09.')
    })
  }

}
