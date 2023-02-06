const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')
const localQueryStrings = require('../../reuseables/querystrings.js')

const TIME_LIMIT = 20000
const aerosolLayer = '#active-MODIS_Terra_Aerosol'
const AodOptionsPanelBody = '#layer_options_modal-modis_terra_aerosol .modal-body'
const AodOptionsPanelHeader = '#layer_options_modal-modis_terra_aerosol .modal-header'
const AodInfoPanel = '.layer_info_modal-modis_terra_aerosol'
const correctedReflectanceBLayer = '#activeB-MODIS_Terra_CorrectedReflectance_TrueColor'
const correctedReflectanceOptionsPanelHeader = '#layer_options_modal-modis_terra_correctedreflectance_truecolor .modal-header'
const correctedReflectanceOptionsPanelBody = '#layer_options_modal-modis_terra_correctedreflectance_truecolor .modal-body'
const correctedReflectanceInfoPanel = '#layer_info_modal-modis_terra_correctedreflectance_truecolor'

module.exports = {
  before (c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },
  'Layer option features work in A|B mode': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.url(c.globals.url + localQueryStrings.swipeAOD)
    c.waitForElementVisible(aerosolLayer, TIME_LIMIT)
    c.expect.element(AodOptionsPanelBody).to.not.be.present
    c.moveToElement(aerosolLayer, 0, 0).pause(200)
    c.click(`${aerosolLayer} .wv-layers-options`)
    c.waitForElementVisible('.layer-settings-modal', TIME_LIMIT)
    c.assert.containsText(
      `${AodOptionsPanelHeader} .modal-title`,
      'Aerosol Optical Depth'
    )
    if (c.options.desiredCapabilities.browser !== 'ie') {
      c.expect.element(`${AodOptionsPanelBody} .wv-palette-selector`)
        .to.be.visible
    }
  },
  'Layer info dialog works in A|B mode': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(`${AodOptionsPanelHeader} .close`).pause(1000)
    c.moveToElement(aerosolLayer, 1, 1)
    c.waitForElementVisible(`${aerosolLayer} .wv-layers-info`)
    c.click(`${aerosolLayer} .wv-layers-info`)
    c.waitForElementVisible(`${AodInfoPanel} .layer-description`, TIME_LIMIT)
    c.assert.containsText(
      AodInfoPanel,
      'The Aerosol Optical Depth layer is useful for studying aerosol optical depth'
    )
  },
  'expect clicking A|B button to close options dialog': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(`${AodInfoPanel} .close`).pause(500)
    c.click(localSelectors.compareButton)
    c.waitForElementVisible(aerosolLayer, TIME_LIMIT, () => {
      c.expect.element(AodOptionsPanelBody).to.not.be.present
    })
  },
  'Layer option features after exiting A|B mode': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.moveToElement(aerosolLayer, 1, 1).pause(200)
    c.click(`${aerosolLayer} .wv-layers-options`)
    c.waitForElementVisible(AodOptionsPanelBody, TIME_LIMIT, () => {
      c
        .useCss()
        .assert.containsText(
          `${AodOptionsPanelHeader} .modal-title`,
          'Aerosol Optical Depth'
        )
      if (c.options.desiredCapabilities.browser !== 'ie') {
        c.expect.element(`${AodOptionsPanelBody} .wv-palette-selector`).to
          .be.visible
      }
    })
  },
  'Layer info dialog works after exiting A|B mode': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(`${AodOptionsPanelHeader} .close`).pause(500)
    c.moveToElement(aerosolLayer, 0, 0).pause(200)
    c.click(`${aerosolLayer} .wv-layers-info`)
    c.waitForElementVisible(
      `${AodInfoPanel} .layer-description`,
      TIME_LIMIT,
      () => {
        c
          .useCss()
          .assert.containsText(
            AodInfoPanel,
            'The Aerosol Optical Depth layer is useful for studying aerosol optical depth'
          )
      }
    )
  },
  'expect reactivating A|B to close options dialog and activate B state': function (
    c
  ) {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(`${AodInfoPanel} .close`).pause(500)
    c.moveToElement(aerosolLayer, 1, 1).pause(200)
    c.click(`${aerosolLayer} .wv-layers-options`).pause(500)
    c.click(`${AodOptionsPanelHeader} .close`).pause(500)
    c.click(localSelectors.compareButton)
    c.waitForElementVisible(aerosolLayer, TIME_LIMIT, () => {
      c.pause(500)
      c.expect.element(AodOptionsPanelBody).to.not.be.present
      c.click(localSelectors.bTab)
    })
  },
  'Layer option features work in B state': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.waitForElementVisible(correctedReflectanceBLayer, TIME_LIMIT)
    c.expect.element(AodOptionsPanelBody).to.not.be.present
    c.moveToElement(correctedReflectanceBLayer, 1, 1).pause(200)
    c.click(`${correctedReflectanceBLayer} .wv-layers-options`)
    c.waitForElementVisible('.layer-settings-modal', TIME_LIMIT)
    c.assert.containsText(
      `${correctedReflectanceOptionsPanelHeader} .modal-title`,
      'Corrected Reflectance (True Color)'
    )
    if (c.options.desiredCapabilities.browser !== 'ie') {
      c.expect.element(
        `${correctedReflectanceOptionsPanelBody} .wv-palette-selector`
      ).to.not.be.present
    }
  },
  'Layer info dialog works after clicking into B mode': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(`${correctedReflectanceOptionsPanelHeader} .close`)
    c.waitForElementNotPresent('#layer_options_modal-modis_terra_correctedreflectance_truecolor .modal-header', TIME_LIMIT)
    c.moveToElement(correctedReflectanceBLayer, 0, 0).pause(200)
    c.click(`${correctedReflectanceBLayer} .wv-layers-info`)
    c.pause(500)
    c.waitForElementVisible(
      `${correctedReflectanceInfoPanel} .layer-metadata`,
      TIME_LIMIT,
      () => {
        c
          .useCss()
          .assert.containsText(
            correctedReflectanceInfoPanel,
            'These images are called true-color or natural color because this combination of wavelengths is similar to what the human eye'
          )
      }
    )
  },
  after (c) {
    c.end()
  }
}
