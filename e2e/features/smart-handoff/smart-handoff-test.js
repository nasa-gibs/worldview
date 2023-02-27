const reuseables = require('../../reuseables/skip-tour.js')
const {
  addLayers,
  allCategoryHeader,
  layerBrowseList,
  layersModalCloseButton
} = require('../../reuseables/selectors.js')

const TIME_LIMIT = 10000

const smartHandoffContainer = '.smart-handoff-side-panel'
const layersTab = '#layers-sidebar-tab'
const dataTabButton = '#download-sidebar-tab'
const downloadButton = '.download-btn'
const cloudRadiusRadioButton = '#C1443536017-LAADS-MODIS_Aqua_Cloud_Effective_Radius-collection-choice-label'
const SSTRadioButton = '#C1664741463-PODAAC-GHRSST_L4_MUR_Sea_Surface_Temperature-collection-choice-label'
const urlParams = '?l=Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m&t=2019-12-01'
const permalinkParams = '?l=GHRSST_L4_MUR_Sea_Surface_Temperature,MODIS_Aqua_Aerosol_Optical_Depth_3km&lg=true&sh=MODIS_Aqua_Aerosol_Optical_Depth_3km,C1443528505-LAADS&t=2020-02-06-T06%3A00%3A00Z'
const permalinkParams1980 = '?l=GHRSST_L4_MUR_Sea_Surface_Temperature,MODIS_Aqua_Aerosol_Optical_Depth_3km&lg=true&sh=MODIS_Aqua_Aerosol_Optical_Depth_3km,C1443528505-LAADS&t=1980-02-06-T06%3A00%3A00Z'
const extentCrossedDateline = '?v=226.32336353630282,-35.84415340249873,233.47009302183025,-31.309041515170094&l=VIIRS_NOAA20_Thermal_Anomalies_375m_All,Coastlines_15m,MODIS_Terra_CorrectedReflectance_TrueColor&lg=false&sh=VIIRS_NOAA20_Thermal_Anomalies_375m_All,C1355615368-LANCEMODIS&t=2021-08-29-T17%3A56%3A03Z'

module.exports = {

  'Data tab is available and in default state when clicked': (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.url(c.globals.url + urlParams)

    // Verify Data tab is in sidebar
    c.expect.element(dataTabButton).to.be.visible

    // Click Data Download tab to switch to Data with 'No Data Selected'
    c.click(dataTabButton)
    c.waitForElementVisible(smartHandoffContainer, TIME_LIMIT)
    c.expect
      .element('.smart-handoff-side-panel > h1')
      .to.have.text.equal('None of your current layers are available for download.')
  },

  'Select "Cloud Effective Radius" layer and check that it is available for download': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    // Go to layers tabs
    c.click(layersTab)
    c.pause(300)
    c.click(addLayers)
    c.pause(300)
    c.click(allCategoryHeader)

    // Add specified layer to layer list
    c.waitForElementVisible(layerBrowseList, TIME_LIMIT, (e) => {
      c.click('#accordion-legacy-all-cloud-effective-radius')
      c.waitForElementVisible('#accordion-legacy-all-cloud-effective-radius .measure-row-contents', TIME_LIMIT, (e) => {
        c.click('#MODIS_Aqua_Cloud_Effective_Radius-checkbox')
        c.pause(300)
        c.click(layersModalCloseButton)
      })
    })

    // Switch back to download tab
    c.click(dataTabButton)

    // Ensure layer is now showing as an option for download
    c.waitForElementVisible(cloudRadiusRadioButton, TIME_LIMIT, (e) => {
      c.click(cloudRadiusRadioButton)
      c.pause(500)
    })

    // Verify granules and date are correct
    c.expect
      .element('.granule-count-header')
      .to.have.text.equal('Available granules for 2019 DEC 01:')
    c.waitForElementVisible('.granule-count-info', TIME_LIMIT)
  },

  'Enable area of interest': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click('#chk-crop-toggle')
    c.waitForElementVisible('.granule-count-info', TIME_LIMIT)
  },

  'Arriving via permalink, data tab selected and granule count shows': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.url(c.globals.url + permalinkParams)
    c.expect.element(dataTabButton).to.be.visible
    c.waitForElementVisible('.granule-count-info', TIME_LIMIT)
    c.expect.element('.granule-count-info').to.not.have.text.equal('NONE')
  },

  'Changing collection updates URL': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(SSTRadioButton)
    c.pause(200)
    c.assert.urlContains('&sh=GHRSST_L4_MUR_Sea_Surface_Temperature,C1664741463-PODAAC')
  },

  'Layers outside of their coverage date range are hidden from layers available for download': (c) => {
    c.url(c.globals.url + permalinkParams1980)
    c.expect.element(dataTabButton).to.be.visible
    c.waitForElementVisible(smartHandoffContainer, TIME_LIMIT)
    c.expect
      .element('.smart-handoff-side-panel > h1')
      .to.have.text.equal('None of your current layers are available for download.')
  },

  'Map extent entirely across dateline disables download button and displays warning for user to zoom out to see available map': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.url(c.globals.url + extentCrossedDateline)
    c.waitForElementVisible(smartHandoffContainer, TIME_LIMIT)
    c.expect.element(downloadButton).to.be.visible
    c.useCss().assert.cssClassPresent(downloadButton, 'wv-disabled')
    c.waitForElementVisible('#data-download-unavailable-dateline-alert', TIME_LIMIT, () => {
      c.assert.containsText('#data-download-unavailable-dateline-alert div.wv-alert-message',
        'The map is zoomed into an area with no available data.')
    })
  },

  'Download via Earthdata Search': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.url(c.globals.url + permalinkParams)
    c.waitForElementVisible(smartHandoffContainer, TIME_LIMIT)
    c.click(downloadButton)
    c.expect
      .element('#transferring-to-earthdata-search')
      .to.be.present

    // Check that Earthdata Search opens in new tab
    c.click('#continue-btn').pause(2500)
    c.windowHandles((tabs) => {
      c.assert.equal(tabs.value.length, 2)
    })
  },

  after (c) {
    c.end()
  }
}
