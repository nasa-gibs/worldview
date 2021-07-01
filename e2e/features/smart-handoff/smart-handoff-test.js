const reuseables = require('../../reuseables/skip-tour.js');
const {
  addLayers,
  allCategoryHeader,
  layerBrowseList,
  layersModalCloseButton,
} = require('../../reuseables/selectors.js');

const TIME_LIMIT = 10000;

const layersTab = '#layers-sidebar-tab';
const dataTabButton = '#download-sidebar-tab';
const cloudRadiusRadioButton = '#C1443536017-LAADS-MODIS_Aqua_Cloud_Effective_Radius-collection-choice-label';
const SSTRadioButton = '#C1664741463-PODAAC-GHRSST_L4_MUR_Sea_Surface_Temperature-collection-choice-label';
const urlParams = '?l=Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m&t=2019-12-01';
const permalinkParams = '?l=GHRSST_L4_MUR_Sea_Surface_Temperature,MODIS_Aqua_Aerosol_Optical_Depth_3km&lg=true&sh=MODIS_Aqua_Aerosol_Optical_Depth_3km,C1443528505-LAADS&t=2020-02-06-T06%3A00%3A00Z';
const permalinkParams1980 = '?l=GHRSST_L4_MUR_Sea_Surface_Temperature,MODIS_Aqua_Aerosol_Optical_Depth_3km&lg=true&sh=MODIS_Aqua_Aerosol_Optical_Depth_3km,C1443528505-LAADS&t=1980-02-06-T06%3A00%3A00Z';

module.exports = {

  'Data tab is available and in default state when clicked': (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
    c.url(c.globals.url + urlParams);

    // Verify Data tab is in sidebar
    c.expect.element(dataTabButton).to.be.visible;

    // Click Data Download tab to switch to Data with 'No Data Selected'
    c.click(dataTabButton);

    c.expect
      .element('.smart-handoff-side-panel > h1')
      .to.have.text.equal('None of your current layers are available for download.');
  },

  'Select "Cloud Effective Radius" layer and check that it is available for download': (c) => {
    // Go to layers tabs
    c.click(layersTab);
    c.click(addLayers);
    c.click(allCategoryHeader);

    // Add specified layer to layer list
    c.waitForElementVisible(layerBrowseList, TIME_LIMIT, (e) => {
      c.click('#accordion-legacy-all-cloud-effective-radius');
      c.waitForElementVisible('#checkbox-case-MODIS_Aqua_Cloud_Effective_Radius', TIME_LIMIT, (e) => {
        c.click('#checkbox-case-MODIS_Aqua_Cloud_Effective_Radius');
        c.click(layersModalCloseButton);
      });
    });

    // Switch back to download tab
    c.click(dataTabButton);

    // Ensure layer is now showing as an option for download
    c.waitForElementVisible(cloudRadiusRadioButton, TIME_LIMIT, (e) => {
      c.click(cloudRadiusRadioButton);
      c.pause(500);
    });

    // Verify granules and date are correct
    c.expect
      .element('.granule-count-header')
      .to.have.text.equal('Available granules for 2019 Dec 01:');
    c.assert.containsText('.granule-count-info', '289');
  },

  'Enable area of interest': (c) => {
    c.click('#chk-crop-toggle');
    c.assert.containsText('.granule-count-info', 'of 289');
  },

  'Download via Earthdata Search': (c) => {
    c.click('.download-btn');
    c.expect
      .element('#transferring-to-earthdata-search')
      .to.be.present;

    // Check that Earthdata Search opens in new tab
    c.click('#continue-btn').pause(2500);
    c.windowHandles((tabs) => {
      c.assert.equal(tabs.value.length, 2);
    });
  },

  'Arriving via permalink, data tab selected and granule count shows': (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
    c.url(c.globals.url + permalinkParams);
    c.expect.element(dataTabButton).to.be.visible;
    c.expect
      .element('.granule-count-info')
      .to.not.have.text.equal('NONE');
  },

  'Changing collection updates URL': (c) => {
    c.click(SSTRadioButton);
    c.pause(200);
    c.assert.urlContains('&sh=GHRSST_L4_MUR_Sea_Surface_Temperature,C1664741463-PODAAC');
  },

  'Layers outside of their coverage date range are hidden from layers available for download': (c) => {
    c.url(c.globals.url + permalinkParams1980);
    c.expect.element(dataTabButton).to.be.visible;
    c.expect
      .element('.smart-handoff-side-panel > h1')
      .to.have.text.equal('None of your current layers are available for download.');
  },

  after(c) {
    c.end();
  },
};
