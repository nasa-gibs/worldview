const customsSquashedQuerystring = '?p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Combined_Value_Added_AOD(opacity=0.7,palette=blue_2,min=0.1,0.105,max=0.56,0.565),MODIS_Terra_Aerosol,Reference_Labels_15m(opacity=0.94),Reference_Features_15m(hidden),Coastlines_15m&t=2019-01-15-T00%3A00%3A00Z&z=3&v=-271.7031658620978,-216.84375,370.1093341379022,36.84375'
const TIME_LIMIT = 10000
const skipTour = require('../../reuseables/skip-tour.js')

const combinedAodSettingsButton = '#active-MODIS_Combined_Value_Added_AOD .wv-layers-options'
const terraAodSettingsButton = '#active-MODIS_Terra_Aerosol .wv-layers-options'
const terraAodSettingsDialog = '#layer_options_modal-modis_terra_aerosol'
const thresholdMinLabel = '#wv-layer-options-threshold0 .wv-label-range-min'
const activeBluePaletteCheckbox = '.wv-palette-selector-row.checked #wv-palette-radio-blue_2'
const activeDefaultPaletteCheckbox = '.wv-palette-selector-row.checked #wv-palette-radio-__default'
const opacityLabel = '.layer-opacity-select .wv-label'
module.exports = {
  before (client) {
    skipTour.loadAndSkipTour(client, TIME_LIMIT)
  },
  'Verify that settings button opens settings modal': function (client) {
    client.url(client.globals.url + customsSquashedQuerystring)
    client.moveToElement('#active-MODIS_Combined_Value_Added_AOD', 1, 1)
    client.waitForElementVisible(
      combinedAodSettingsButton,
      TIME_LIMIT,
      (e) => {
        if (client.options.desiredCapabilities.browser !== 'ie') {
          client.expect.element(thresholdMinLabel).to.not.be.present
          client.click(combinedAodSettingsButton)
          client.waitForElementPresent(thresholdMinLabel, TIME_LIMIT)
        }
      }
    )
  },
  'Verify that custom blue custom palette is checked': function (client) {
    if (client.options.desiredCapabilities.browser !== 'ie') {
      client.expect.element(activeDefaultPaletteCheckbox).to.not.be.present
      client.expect.element(activeBluePaletteCheckbox).to.be.present
    }
  },
  'Verify that threshold and opacity components update when different layer setting button clicked': function (
    client
  ) {
    if (client.options.desiredCapabilities.browser !== 'ie') {
      client.useCss().assert.containsText(thresholdMinLabel, '0.1 – 0.105')
      client.useCss().assert.containsText(opacityLabel, '70%')
      client.moveToElement('#active-MODIS_Terra_Aerosol', 1, 1).pause(200)
      client.click(terraAodSettingsButton)
      client.waitForElementPresent(
        terraAodSettingsDialog,
        TIME_LIMIT,
        () => {
          client.useCss().assert.containsText(thresholdMinLabel, '< 0.0')
          client.useCss().assert.containsText(opacityLabel, '100%')
        }
      )
    }
  },
  'Verify that default palette is now checked': function (client) {
    if (client.options.desiredCapabilities.browser !== 'ie') {
      client.expect.element(activeBluePaletteCheckbox).to.not.be.present
      client.expect.element(activeDefaultPaletteCheckbox).to.be.present
    }
  }
}
