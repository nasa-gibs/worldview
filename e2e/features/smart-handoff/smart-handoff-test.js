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
const urlParams = '?l=Reference_Labels(hidden),Reference_Features(hidden),Coastlines&t=2019-12-01';

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
    c.expect.element(cloudRadiusRadioButton).to.be.present;

    c.click(cloudRadiusRadioButton);

    // Verify granules and date are correct
    c.expect
      .element('.granule-count > h1')
      .to.have.text.equal('Available granules for 2019 Dec 01: 289');
  },

  'Enable target area selection': (c) => {
    c.click('#chk-crop-toggle');
    c.assert.containsText('.granule-count > h1', 'of 289');
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

  after(c) {
    c.end();
  },
};
