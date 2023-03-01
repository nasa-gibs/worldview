const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')
const localQueryStrings = require('../../reuseables/querystrings.js')

const TIME_LIMIT = 20000
module.exports = {
  before (client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT)
  },
  /**
   * Ensure that page loads with correct A|B mode, A|B state, and
   * date with given queryString
   */
  'Swipe mode and A|B state A are active and date is correct': function (
    client
  ) {
    client.url(client.globals.url + localQueryStrings.swipeAndAIsActive)
    client.waitForElementVisible(
      localSelectors.swipeDragger,
      TIME_LIMIT,
      () => {
        client.expect.element(localSelectors.swipeButton).to.not.be.enabled
        client.assert.cssClassPresent(localSelectors.aTab, 'active')
        client
          .useCss()
          .assert.containsText(localSelectors.aTab, 'A: 2018 AUG 17')
      }
    )
  },
  'Opacity mode and A|B state B are active and date is correct': function (
    client
  ) {
    client.url(client.globals.url + localQueryStrings.opacityAndBIsActive)
    client.waitForElementVisible('#ab-slider-case', TIME_LIMIT, () => {
      client.expect.element(localSelectors.opacityButton).to.not.be.enabled
      client.assert.cssClassPresent(localSelectors.bTab, 'active')
      client.useCss().assert.containsText(localSelectors.bTab, 'B: 2018 AUG 16')
    })
  },
  'Spy mode is active in B state': function (client) {
    client.url(client.globals.url + localQueryStrings.spyAndBIsActive)
    client.waitForElementPresent('.ab-spy-span', TIME_LIMIT, () => {
      client.expect.element(localSelectors.spyButton).to.not.be.enabled
      client.assert.cssClassPresent(localSelectors.bTab, 'active')
      client.useCss().assert.containsText(localSelectors.bTab, 'B: 2018 AUG 16')
    })
  },
  /**
   * Ensure that A|B state loads with correct layers given permalink
   */
  'A|B loaded with one only layer in A section -- Corrected Reflectance (True Color)': function (
    client
  ) {
    client.url(client.globals.url + localQueryStrings.swipeAndAIsActive)
    client.waitForElementPresent(localSelectors.aTab, TIME_LIMIT, () => {
      client.expect.element(
        '.ab-tabs-case .tab-pane.active ul#overlays .item'
      ).to.not.be.present
      client.expect.element(
        '#active-MODIS_Terra_CorrectedReflectance_TrueColor'
      ).to.be.visible
    })
  },
  'Click B tab to ensure that loaded layers are correct': function (client) {
    client.click(localSelectors.bTab)
    client.waitForElementVisible('#activeB-Coastlines_15m', TIME_LIMIT, () => {
      client.expect.element(
        '#activeB-MODIS_Aqua_CorrectedReflectance_TrueColor.layer-hidden'
      ).to.be.visible
      client.expect.element(
        '#activeB-VIIRS_SNPP_CorrectedReflectance_TrueColor.layer-hidden'
      ).to.be.visible
      client.expect.element(
        '#activeB-Reference_Labels_15m.layer-hidden'
      ).to.be.visible
      client.expect.element(
        '#activeB-Reference_Features_15m.layer-hidden'
      ).to.be.visible
      client.expect.element('#activeB-Coastlines_15m.layer-visible').to.be.visible
      client.expect.element(
        '#activeB-MODIS_Terra_CorrectedReflectance_TrueColor.layer-visible'
      ).to.be.visible
    })
  },
  after (client) {
    client.end()
  }
}
