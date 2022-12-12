const { normalizeViewport } = require('../../reuseables/normalize-viewport.js')

const TIME_LIMIT = 10000
const enabledPermalink = '?l=Last_of_the_Wild_1995-2004'
const disabledPermalink = '?l=Last_of_the_Wild_1995-2004(disabled=0-13-12-1-2-6)'
const classColorBoxId = '#Last_of_the_Wild_1995-2004_0_legend-color-Last_of_the_Wild_1995-2004-active'
module.exports = {
  before (client) {
    normalizeViewport(client, 1000, 850)
    client.url(client.globals.url + enabledPermalink)
  },
  'Verify that toggling class updates permalink and layer-legend': (client) => {
    client.waitForElementVisible('#active-Last_of_the_Wild_1995-2004', TIME_LIMIT, () => {
      client.expect.element('#active-Last_of_the_Wild_1995-2004 .disabled-classification').to.not.be.present
      client.moveToElement('#active-Last_of_the_Wild_1995-2004', 1, 1).pause(200)
      client.click('#active-Last_of_the_Wild_1995-2004 .wv-layers-options')
      client.waitForElementVisible('.layer-classification-toggle', 2000, () => {
        client.click('.classification-list .react-switch-case .react-switch-button')
        client.waitForElementVisible(`${classColorBoxId}0.disabled-classification`, TIME_LIMIT, () => {
          client.expect.element(`${classColorBoxId}1.disabled-classification`).to.not.be.present
          client.assert.urlContains('(disabled=0)')
        })
      })
    })
  },
  'Verify that toggling class-all off updates permalink and layer-legend': (client) => {
    client.click('.classification-switch-header .react-switch-case .react-switch-button')
    client.waitForElementVisible(`${classColorBoxId}15.disabled-classification`, TIME_LIMIT, () => {
      client.expect.element(`${classColorBoxId}0.disabled-classification`).to.be.present
      client.expect.element(`${classColorBoxId}1.disabled-classification`).to.be.present
      client.assert.urlContains('(disabled=0-1-2-3-4-5-6-7-8-9-10-11-12-13-14-15)')
    })
  },
  'Verify that toggling class-all on updates permalink and layer-legend': (client) => {
    client.click('.classification-switch-header .react-switch-case .react-switch-button')
    client.pause(1000)
    client.expect.element(`${classColorBoxId}0.disabled-classification`).to.not.be.present
    client.expect.element(`${classColorBoxId}15.disabled-classification`).to.not.be.present
  },
  'Verify that loaded permalink disables classes': (client) => {
    client.url(client.globals.url + disabledPermalink)
    client.waitForElementVisible(`${classColorBoxId}0`, TIME_LIMIT, () => {
      client.expect.element(`${classColorBoxId}0.disabled-classification`).to.be.present
      client.expect.element(`${classColorBoxId}13.disabled-classification`).to.be.present
      client.expect.element(`${classColorBoxId}6.disabled-classification`).to.be.present
      client.expect.element(`${classColorBoxId}5.disabled-classification`).to.not.be.present
      client.expect.element(`${classColorBoxId}11.disabled-classification`).to.not.be.present
      client.expect.element(`${classColorBoxId}3.disabled-classification`).to.not.be.present
    })
  },
  after (client) {
    client.end()
  }
}
