const { assertCategories } = require('../../reuseables/layer-picker.js')
const skipTour = require('../../reuseables/skip-tour.js')
const {
  addLayers,
  collapsedLayerButton,
  layersSearchField,
  layerSearchList,
  layerPickerBackButton
} = require('../../reuseables/selectors.js')

const TIME_LIMIT = 10000

module.exports = {
  before: (c) => {
    skipTour.loadAndSkipTour(c, TIME_LIMIT)
    c.url(`${c.globals.url}?t=2020-07-04`)
    c.setWindowSize(375, 667) // iPhone 6/7/8 dimensions
  },
  'Layer picker shows categories when first opened': (c) => {
    c.waitForElementVisible(collapsedLayerButton, TIME_LIMIT)
    c.click(collapsedLayerButton)
    c.click(addLayers)
    c.waitForElementVisible('.categories-dropdown-header', TIME_LIMIT, assertCategories(c))
  },
  'Select several layers': (c) => {
    c.setValue(layersSearchField, 'aod')
    c.waitForElementVisible(layerSearchList, TIME_LIMIT)
    c.click('#MODIS_Aqua_Aerosol-checkbox')
    c.click('#MODIS_Combined_Value_Added_AOD-checkbox')
    c.click('#OMI_Aerosol_Optical_Depth-checkbox')
    c.click(layerPickerBackButton)
  },
  'Recent tab shows layers that were selected': (c) => {
    c.click('.categories-dropdown-header .dropdown-toggle')
    c.waitForElementVisible('.categories-dropdown-item:nth-of-type(4)', TIME_LIMIT)
    c.click('.categories-dropdown-item:nth-of-type(4)')
    c.expect.element('#MODIS_Aqua_Aerosol-search-row').to.be.present
    c.expect.element('#MODIS_Combined_Value_Added_AOD-search-row').to.be.present
    c.expect.element('#OMI_Aerosol_Optical_Depth-search-row').to.be.present
  },
  'Removing individual layers updates the list': (c) => {
    // Swipe to delete?!
  },
  'Clear list button empties the entire list': (c) => {
    c.click('#clear-recent-layers')
    c.expect.element('.product-outter-list-case.layers-all').to.not.be.present
    c.expect.element('.no-results').to.be.present
  },
  after: (c) => {
    c.end()
  }
}
