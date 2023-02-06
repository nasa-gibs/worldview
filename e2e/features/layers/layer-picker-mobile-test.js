const skipTour = require('../../reuseables/skip-tour.js')
const { assertCategories, assertDefaultLayers } = require('../../reuseables/layer-picker.js')

const {
  availableFacetLabel,
  categoryAtmosphereLabel,
  collapsedLayerButton,
  layerCount,
  layerContainer,
  layersSearchField,
  layerSearchList,
  layersSearchRow,
  layerPickerBackButton,
  layerDetails,
  layerDetailHeader,
  addLayers,
  addToMapButton,
  layersModalCloseButton,
  aodCheckbox,
  aodSearchRow,
  aodSearchCheckbox,
  aodAllMeasurement,
  aodAllMeasurementContents,
  aodTabContentAquaMODIS,
  aodCheckboxMODIS,
  aodCheckboxMAIAC,
  aquaTerraMODISTab,
  aquaTerraModisHeader,
  aquaModisTab,
  filterButton,
  sourceTabs,
  sourceMetadataCollapsed,
  sourceMetadataExpanded,
  categoryFacetCollapseToggle,
  categoryFacetChoicesContainer,
  measurementFacetChoices,
  measurementMoreButton,
  measurementTemperatureLabel,
  sourcesMERRALabel,
  applyButton,
  resetButton
} = require('../../reuseables/selectors.js')

const TIME_LIMIT = 10000

module.exports = {
  before: (c) => {
    skipTour.loadAndSkipTour(c, TIME_LIMIT)
    c.url(`${c.globals.url}?t=2013-05-15`)
    c.setWindowSize(375, 667) // iPhone 6/7/8 dimensions
  },
  'Initial state indicates layer count': (c) => {
    c.waitForElementVisible(collapsedLayerButton, TIME_LIMIT, (e) => {
      c.expect.element(layerCount).to.be.present
      c.assert.containsText(layerCount, '7')
    })
  },
  'Expand layer list and show default layers': (c) => {
    c.click(collapsedLayerButton)
    c.waitForElementVisible(layerContainer, TIME_LIMIT, assertDefaultLayers(c))
  },
  'Open product picker and show categories by default': (c) => {
    c.click(addLayers)
    c.waitForElementVisible('.categories-dropdown-header', TIME_LIMIT, assertCategories(c))
  },
  'Clicking a measurement shows choices, indicates unavailability': (c) => {
    c.click(aodAllMeasurement)
    c.waitForElementVisible(aodAllMeasurementContents, TIME_LIMIT, (e) => {
      c.expect.element(sourceMetadataCollapsed).to.be.present
      // Checkboxes for two layers are visible
      c.expect.element(aodCheckboxMODIS).to.be.present
      c.expect.element(aodCheckboxMAIAC).to.be.present
      // Indicate that MODIS Combined layer has no available coverage
      c.expect.element(`${aodCheckboxMODIS} + svg#availability-info`).to.be.present
      // Indicate that MAIAC layer has no available coverage
      c.expect.element(`${aodCheckboxMAIAC} + svg#availability-info`).to.be.present
      c.expect.elements(sourceTabs).count.to.equal(8)
    })
  },
  'Available grid source layer measuremet does not have unavaiable coverage class': (c) => {
    // swith to Aqua/MODIS measurement nav item
    c.click(aquaTerraMODISTab)
    c.pause(500)
    c.click(aquaModisTab)
    c.waitForElementVisible(aodTabContentAquaMODIS, TIME_LIMIT, (e) => {
      c.expect.element(aodCheckbox).to.be.present
      // Avaialable layer does not have unavailable class
      c.assert.not.cssClassPresent(aodCheckbox, 'unavailable')
      // switch back to previous 'Aqua and Terra/MODIS' measurement nav item
      c.click(aquaTerraMODISTab)
    })
  },
  'Expanding measurement details': (c) => {
    c.click('.ellipsis')
    c.waitForElementVisible(sourceMetadataExpanded, TIME_LIMIT, (e) => {
      // c.pause(30000);
      c.assert.containsText(aquaTerraModisHeader, 'About Aerosol Optical Depth (AOD)')
      // c.assert.containsText(maiacHeader, 'MAIAC Aerosol Optical Depth');
      // c.expect.elements('.source-metadata > p').count.to.equal(10);
      c.expect.element('.ellipsis.up').to.be.present
    })
  },
  'Collapsing measurement details': (c) => {
    c.click('.ellipsis.up').pause(250)
    c.assert.cssClassPresent('.source-metadata', 'overflow')
  },
  'Switching source tabs': (c) => {
    c.click(aquaModisTab).pause(250)
    c.expect.element(aodCheckbox).to.be.present
    c.expect.element('h3#aboutaerosolopticaldepthaod').to.be.present
    c.assert.containsText('h3#aboutaerosolopticaldepthaod', 'About Aerosol Optical Depth (AOD)')
    c.click(aodCheckbox)
  },
  'Back button returns to categories': (c) => {
    c.click(layerPickerBackButton)
    c.waitForElementVisible('.categories-dropdown-header', TIME_LIMIT, assertCategories(c))
  },
  'Switch to facet view and confirm applying facets limits results': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(filterButton)
    c.waitForElementVisible('.facet-container', TIME_LIMIT, (e) => {
      c.click(availableFacetLabel)
      c.click(categoryAtmosphereLabel)

      // Collapse a set and confirm it hides
      c.click(categoryFacetCollapseToggle)
      c.expect.element(categoryFacetChoicesContainer).to.not.be.present

      // + More button adds 10 choices
      c.expect.elements(measurementFacetChoices).count.to.equal(5)
      c.click(measurementMoreButton)
      c.expect.elements(measurementFacetChoices).count.to.equal(15)

      c.click(measurementTemperatureLabel)
      c.click(sourcesMERRALabel)
      c.click(applyButton)
      c.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
        c.expect.elements(layersSearchRow).count.to.equal(4)
      })
      c.click(resetButton)
    })
  },
  'Searching for layers': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.setValue(layersSearchField, 'aerosol optical depth')
    c.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
      c.expect.elements(layersSearchRow).count.to.equal(17)
      c.assert.attributeEquals('.search-row .checked input', 'id', 'MODIS_Aqua_Aerosol-checkbox')
    })
  },
  'Viewing details for search results': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(aodSearchRow)
    c.waitForElementVisible(layerDetails, TIME_LIMIT, (e) => {
      c.assert.containsText(layerDetailHeader, 'Aerosol Optical Depth')
      c.assert.containsText(addToMapButton, 'Remove Layer')
    })
  },
  'Add to layer button and checkbox are in sync': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    // Remove the layer
    c.click(addToMapButton).pause(200)
    c.assert.not.cssClassPresent(aodSearchCheckbox, 'checked')
    c.assert.containsText(addToMapButton, 'Add Layer')
    // Add it again
    c.click(aodCheckbox).pause(200)
    c.assert.containsText(addToMapButton, 'Remove Layer')
    c.assert.cssClassPresent(aodSearchCheckbox, 'checked')
  },
  'Clicking the selected row deselects it and hides the details': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(aodSearchRow).pause(300)
    c.expect.element(layerDetails).to.not.be.present
    c.assert.not.cssClassPresent(aodSearchRow, 'selected')
    c.click(aodSearchRow).pause(300)
    c.assert.cssClassPresent(aodSearchRow, 'selected')
  },
  'Close product picker and confirm added layers show in sidebar': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(layersModalCloseButton).pause(200)
    c.expect.element('#active-MODIS_Aqua_Aerosol').to.be.present
  },
  'Collapse sidebar and confirm layer count updated': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click('#toggleIconHolder').pause(200)
    c.expect.element(layerCount).to.be.present
    c.assert.containsText(layerCount, '8')
  },
  after: (c) => {
    c.end()
  }
}
