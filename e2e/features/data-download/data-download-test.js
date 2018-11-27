const reuseables = require('../../reuseables/skip-tour.js');
const layersTab = '#layers-sidebar-tab';
const dataDownloadTabButton = '#download-sidebar-tab';
const zoomInButton = '#wv-map-geographic > div.wv-map-zoom-in.wv-map-zoom.ui-button.ui-corner-all.ui-widget';
const zoomOutButton = '#wv-map-geographic > div.wv-map-zoom-out.wv-map-zoom.ui-button.ui-corner-all.ui-widget';

const TIME_LIMIT = 20000;
module.exports = {
  'Initial State - Data Download tab is available and in default state when clicked': function(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);

    // Verify Data Download tab is in sidebar
    client.expect.element(dataDownloadTabButton).to.be.visible;

    // Click Data Download tab to switch to Data with 'No Data Selected'
    client.click(dataDownloadTabButton);
    client.expect.element('#compare-toggle-button > span').to.have.text.equal('No Data Selected');

    // All 6 default layers in Not Available for Download
    client.elements('css selector', '.wv-datacategory > li', function(result) {
      client.assert.equal(result.value.length, 6);
    });

    // No 'Searching for Data' CMR query indicator present
    client.expect.element('#indicator').to.not.be.present;
  },
  'No Results - No Data Available indicator displayed when no data': function(client) {
    // December 31, 2022 no results
    let queryString = '?now=2022-12-31T12&p=geographic&l=MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Coastlines&t=2022-12-31&v=-91.125,-53.3671875,82.40625,59.8359375&download=MOD04_L2';
    client.url(client.globals.url + queryString);

    // 'No Data Available' indicator present
    client.expect.element('#indicator').to.be.present.after(TIME_LIMIT);
    client.expect.element('#indicator > span').to.have.text.equal('No Data Available').after(500);

    // On Valid Data Select, 'No Data Available' indicator disappears and data layer is in sidebar
    client.clearValue('#year-animation-widget-main');
    client.setValue('#year-animation-widget-main', ['2013', client.Keys.ENTER]);
    client.expect.element('#indicator').to.not.be.visible;
    client.expect.element('#wv-data-MOD04_L2MODIS_Terra_Aerosol').to.be.visible;

    // On Valid Data Select, 'No Data Available' indicator appears
    client.clearValue('#year-animation-widget-main');
    client.setValue('#year-animation-widget-main', ['2022', client.Keys.ENTER]);
    client.expect.element('#indicator').to.be.present;
    client.expect.element('#indicator > span').to.have.text.equal('No Data Available').after(500);

    // Click layers tab, indicator disappears
    client.click(layersTab);
    client.expect.element('#indicator').to.not.be.visible;

    // Click data download tab, 'No Data Available' indicator appears
    client.click(dataDownloadTabButton);
    client.expect.element('#indicator').to.be.visible;
    client.expect.element('#indicator > span').to.have.text.equal('No Data Available').after(500);
  },
  'No data in view - Zoom out or move map indicator displayed when no data in view': function(client) {
    // zoomed in so no data in view
    let queryString = '?p=geographic&l=MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Coastlines&t=2013-08-15&v=-115.09722044197,32.076037619082,-112.11113645759,34.018420431582&download=MOD04_L2';
    client.url(client.globals.url + queryString);

    // 'Zoom out or move map' indicator present
    client.expect.element('#indicator').to.be.present.after(TIME_LIMIT);
    client.expect.element('#indicator > span').to.have.text.equal('Zoom out or move map').after(500);

    // Zoom out three times for a data point granule selection button to be visible and indicator disappears
    client.click(zoomOutButton);
    client.click(zoomOutButton);
    client.click(zoomOutButton);
    client.expect.element('#indicator').to.not.be.visible.after(500);

    // Zoom in data point granule selection button is not visible and indicator reappears
    client.click(zoomInButton);
    client.expect.element('#indicator').to.be.visible.after(500);

    // Click layers tab, indicator disappears
    client.click(layersTab);
    client.expect.element('#indicator').to.not.be.visible.after(500);

    // Click data download tab, 'No Data Available' indicator appears
    client.click(dataDownloadTabButton);
    client.expect.element('#indicator').to.be.visible;
    client.expect.element('#indicator > span').to.have.text.equal('Zoom out or move map').after(500);
  },
  'Query Timeout - No results received yet dialog box displayed': function(client) {
    // query timeout
    let queryString = '?timeoutCMR=100&p=geographic&l=MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Coastlines&t=2013-09-29&v=-170.64093281444,-59.218903407221,20.468442185558,65.093596592779';
    client.url(client.globals.url + queryString);

    // Click Data Download tab and show 'No results received yet' dialog box
    client.waitForElementVisible(dataDownloadTabButton, TIME_LIMIT, function() {
      client.click(dataDownloadTabButton);
      client.expect.element('.wv-dialog').to.have.text.equal('No results received yet. This may be due to a connectivity issue. Please try again later.').after(500);
    });
  },
  after: function(client) {
    client.end();
  }
};
