const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')

const {
  infoToolbarButton
} = localSelectors

const TIME_LIMIT = 5000
const settingsInfoItem = '#settings_info_item'
const globalSettingsModal = '#global_settings_modal'
const settingContainer = '.global-setting-container'
const KelvinSettingsButton = '#global_settings_modal button.setting-button:nth-child(1)'

const SSTQueryString = '?l=GHRSST_L4_MUR_Sea_Surface_Temperature,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m,VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&lg=false&t=2020-09-28-T20%3A40%3A53Z'
const SSTMinPalette = '#GHRSST_L4_MUR_Sea_Surface_Temperature_GHRSST_Sea_Surface_Temperature_0_legend_0 > div.wv-palettes-min'
const SSTMaxPalette = '#GHRSST_L4_MUR_Sea_Surface_Temperature_GHRSST_Sea_Surface_Temperature_0_legend_0 > div.wv-palettes-max'

module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },

  'Global settings menu item opens global settings modal': (c) => {
    c.expect.element(infoToolbarButton).to.be.present
    c.click(infoToolbarButton)

    c.waitForElementVisible(settingsInfoItem, TIME_LIMIT)
    c.click(settingsInfoItem)

    c.waitForElementVisible(globalSettingsModal)
    c.pause(500)

    c.expect.element(globalSettingsModal).to.be.present
    c.expect.element(settingContainer).to.be.present
  },

  'Initial temp unit is default value in layer palette legend': (c) => {
    c.url(c.globals.url + SSTQueryString)
    c.expect
      .element(SSTMinPalette)
      .to.have.text.equal('< 0.00 °C')
    c.expect
      .element(SSTMaxPalette)
      .to.have.text.equal('≥ 32.00 °C')
  },

  'Selecting Kelvin unit changes unit being used in layer palette legend': (c) => {
    c.click(infoToolbarButton)

    c.waitForElementVisible(settingsInfoItem, TIME_LIMIT)
    c.click(settingsInfoItem)

    c.waitForElementVisible(globalSettingsModal)
    c.pause(500)

    c.click(KelvinSettingsButton)
    c.pause(500)

    c.expect
      .element(SSTMinPalette)
      .to.have.text.equal('< 273.15 K')
    c.expect
      .element(SSTMaxPalette)
      .to.have.text.equal('≥ 305.15 K')
  },

  'Kelvin global unit is retained via localStorage and active on new url': (c) => {
    c.url(c.globals.url + SSTQueryString)
    c.waitForElementVisible(infoToolbarButton, TIME_LIMIT)
    c.click(infoToolbarButton)

    c.waitForElementVisible(settingsInfoItem, TIME_LIMIT)
    c.click(settingsInfoItem)

    c.waitForElementVisible(globalSettingsModal)
    c.pause(500)
    c.useCss().assert.cssClassPresent(KelvinSettingsButton, 'active')

    c.expect
      .element(SSTMinPalette)
      .to.have.text.equal('< 273.15 K')
    c.expect
      .element(SSTMaxPalette)
      .to.have.text.equal('≥ 305.15 K')
  },

  after: (c) => {
    c.end()
  }
}
