const TIME_LIMIT = 30000
const mockParam = '?mockAlerts='
const layerNoticesTestParams = '?l=Coastlines_15m,MODIS_Aqua_CorrectedReflectance_TrueColor,Particulate_Matter_Below_2.5micrometers_2001-2010'
const localSelectors = require('../../reuseables/selectors.js')

const {
  addLayers,
  layersSearchField,
  categoriesNav,
  infoToolbarButton
} = localSelectors

// Selectors
const infoButtonIcon = `${infoToolbarButton} svg.svg-inline--fa`
const infoMenu = '#toolbar_info'
const giftListItem = '#toolbar_info li.gift'
const boltListItem = '#toolbar_info li.bolt'
const notificationsListItem = '#notifications_info_item .fa-exclamation-circle'
const alertContentHighlighted = '#notification_list_modal .alert-notification-item'
const outageContentHighlighted = '#notification_list_modal .outage-notification-item'
const messageContentHighlighted = '#notification_list_modal .message-notification-item'
const aquaNotice = 'The Aqua / MODIS Corrected Reflectance (True Color) layer is currently unavailable.'
const multiNotice = 'Several layers are experiencing delays in processing.'
const tooltipSelector = '.tooltip-inner div'
const aquaZot = '#MODIS_Aqua_CorrectedReflectance_TrueColor-zot'
const particulateZot = '#Particulate_Matter_Below_2__2E__5micrometers_2001-2010-zot'

module.exports = {
  'No visible notifications with mockAlert parameter set to no_types': function (c) {
    c.url(`${c.globals.url + mockParam}no_types`)
    c.waitForElementVisible(infoButtonIcon, TIME_LIMIT)
    c.click(infoButtonIcon)
    c.pause(2000)
    c.expect.element(infoMenu).text.not.contains('Notifications')
    c.expect.element(giftListItem).to.not.be.present
    c.expect.element(boltListItem).to.not.be.present
  },
  'Outage takes precedence when all three notifications are present': function (c) {
    c.url(`${c.globals.url + layerNoticesTestParams}&mockAlerts=all_types`)
    c.waitForElementVisible(infoButtonIcon, TIME_LIMIT)
    c.expect.element(`${infoToolbarButton}.wv-status-outage`).to.be.present
    c.click(infoButtonIcon)
    c.pause(2000)
    c.assert.containsText(infoMenu, 'Notifications')
    c.expect.element(notificationsListItem).to.be.present
  },
  'Verify that layer notices don\'t show up in the notification list or contribute to the count': function (c) {
    c.waitForElementVisible('#notifications_info_item', TIME_LIMIT)
    c.expect.element('span.badge').to.be.present
    c.assert.containsText('span.badge', '3')
  },
  'alert, outage, and message content is highlighted and found in modal': function (c) {
    c.click(notificationsListItem)
    c.waitForElementVisible(outageContentHighlighted, TIME_LIMIT)
    c.assert.containsText(
      `${outageContentHighlighted} span`,
      'Posted 20 May 2018'
    )
    c.assert.containsText(
      `${alertContentHighlighted} p`,
      'learn how to visualize global satellite imagery'
    )
    c.assert.containsText(
      `${messageContentHighlighted} p`,
      'This is a message test'
    )
  },
  'Verify that the user is only alerted if they have not already stored all items in localStorage': function (c) {
    c.click('#notification_list_modal .close')
      .pause(500)
    c.waitForElementVisible(infoButtonIcon, TIME_LIMIT)
    c.expect.element(`${infoToolbarButton}.wv-status-hide`).to.be.present
  },

  // Layer notice tests
  'Verify that zots show for the layers that have notices': function (c) {
    c.waitForElementVisible(infoButtonIcon, TIME_LIMIT)
    c.expect.element(aquaZot).to.be.present
    c.moveToElement(aquaZot, 2, 2)
    c.waitForElementVisible(tooltipSelector, TIME_LIMIT)
    c.assert.containsText(`${tooltipSelector} div:first-of-type`, aquaNotice)
    c.assert.containsText(`${tooltipSelector} div:last-of-type`, multiNotice)

    c.expect.element(particulateZot).to.be.present
    c.moveToElement(particulateZot, 2, 2)
    c.waitForElementVisible(tooltipSelector, TIME_LIMIT)
    c.assert.containsText(`${tooltipSelector} div`, multiNotice)
  },
  'Verify that warning shows in the product picker category/measurement rows': function (c) {
    c.click(addLayers)
    c.waitForElementVisible(categoriesNav, TIME_LIMIT)
    c.pause(500)
    c.click('#layer-category-item-air-quality-corrected-reflectance')
    c.moveToElement('#checkbox-case-MODIS_Aqua_CorrectedReflectance_TrueColor', 2, 2)
    c.waitForElementVisible(tooltipSelector, TIME_LIMIT)
    c.assert.containsText(`${tooltipSelector} div:first-of-type`, aquaNotice)
    c.assert.containsText(`${tooltipSelector} div:last-of-type`, multiNotice)
  },
  'Verify that warning shows in the product picker search results rows': function (c) {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      // For some reason moveToElement seems to inconsistently work in Firefox
      return
    }
    c.setValue(layersSearchField, 'MODIS_Aqua_CorrectedReflectance_TrueColor')
    c.waitForElementVisible('#MODIS_Aqua_CorrectedReflectance_TrueColor-notice-info', TIME_LIMIT)
    c.pause(300)
    c.moveToElement('css selector', '.layer-notice-icon', 0, 0)
    c.pause(500)
    c.waitForElementVisible(tooltipSelector, TIME_LIMIT)
    c.assert.containsText(`${tooltipSelector} div:first-of-type`, aquaNotice)
    c.assert.containsText(`${tooltipSelector} div:last-of-type`, multiNotice)
  },
  after (c) {
    c.end()
  }
}
