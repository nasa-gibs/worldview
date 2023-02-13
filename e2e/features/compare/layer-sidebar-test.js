const reuseables = require('../../reuseables/skip-tour.js')
const selectors = require('../../reuseables/selectors.js')
const localQueryStrings = require('../../reuseables/querystrings.js')

const aodChoices = '#accordion-legacy-all-aerosol-optical-depth .measure-row-contents'
const aodCombinedValueId = 'MODIS_Combined_Value_Added_AOD'
const aodMAIACId = 'MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth'
const aodCheckBox = '#MODIS_Combined_Value_Added_AOD-checkbox'
const aodMAIACCheckbox = '#checkbox-case-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth .wv-checkbox input'
const TIME_LIMIT = 10000

module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, c.globals.timeout)
  },
  'Add AOD Layer to Layer Group A': (c) => {
    c.url(c.globals.url + localQueryStrings.swipeAndAIsActive)
    c.waitForElementVisible(selectors.swipeDragger, c.globals.timeout)
    c.click(selectors.addLayers)
    c.waitForElementVisible(selectors.aerosolOpticalDepth, c.globals.timeout)
    c.click(selectors.aerosolOpticalDepth)

    c.waitForElementVisible(aodChoices, TIME_LIMIT)
    c.click(aodCheckBox)
    c.waitForElementVisible(`#active-${aodCombinedValueId}`, c.globals.timeout)
    c.click(selectors.layersModalCloseButton)
    c.waitForElementNotPresent('#layer_picker_component', TIME_LIMIT)
    c.pause(250)
  },
  'Toggle compare mode to Active state B': (c) => {
    c.click(`${selectors.bTab} .productsIcon`)
    c.waitForElementVisible('#activeB-Coastlines_15m', c.globals.timeout)
  },
  'Verify that AOD layer is not visible': (c) => {
    c.expect.element(`#active-${aodCombinedValueId}`).to.not.be.present
  },
  'Add AOD index layer to Active state B and verify it has been added': (c) => {
    c.click(selectors.addLayers)
    c.waitForElementVisible(aodChoices, c.globals.timeout)
    c.click(aodMAIACCheckbox)
    c.waitForElementVisible(
      '#activeB-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth',
      c.globals.timeout
    )
    c.expect.element(`#activeB-${aodCombinedValueId}`).to.not.be.present
    c.expect.element(`#active-${aodCombinedValueId}`).to.not.be.present
  },
  'Verify that AOD combined is visible and AOD index is not present in Layer list A': function (
    c
  ) {
    c.click(selectors.layersModalCloseButton)
    c.pause(100)
    c.click(selectors.aTab)
    c.waitForElementVisible(
      `#active-${aodCombinedValueId}`,
      c.globals.timeout,
      () => {
        c.expect.element(`#activeB-${aodCombinedValueId}`).to.not.be.present
        c.expect.element(`#activeA-${aodMAIACId}`).to.not.be.present
      }
    )
  },
  after (c) {
    c.end()
  }
}
