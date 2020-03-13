const reuseables = require('../../reuseables/skip-tour.js');

const layersTab = '#layers-sidebar-tab';
const dataDownloadTabButton = '#download-sidebar-tab';
const zoomInButton = '#wv-map-geographic > div.wv-map-zoom-in.wv-map-zoom.ui-button.ui-corner-all.ui-widget';
const zoomOutButton = '#wv-map-geographic > div.wv-map-zoom-out.wv-map-zoom.ui-button.ui-corner-all.ui-widget';
const downYearInputButton = '#date-selector-main > div > div.input-wrapper.input-wrapper-year > div.date-arrows.date-arrow-down';
const upYearInputButton = '#date-selector-main > div > div.input-wrapper.input-wrapper-year > div.date-arrows.date-arrow-up';

module.exports = {
  'Initial State - Data Download tab is available and in default state when clicked': `${function(
    client,
  ) {
    reuseables.loadAndSkipTour(client, client.globals.timeout);

    // Verify Data Download tab is in sidebar
    client.expect.element(dataDownloadTabButton).to.be.visible;

    // Click Data Download tab to switch to Data with 'No Data Selected'
    client.click(dataDownloadTabButton);
    client.expect
      .element('#compare-toggle-button > span')
      .to.have.text.equal('No Data Selected');

    // All 6 default layers in Not Available for Download
    client.elements('css selector', '.wv-datacategory > li', (result) => {
      client.assert.equal(result.value.length, 6);
    });

    // No 'Searching for Data' CMR query indicator present
    client.expect.element('#indicator').to.be.present;
    client.useCss().assert.containsText('#indicator span', 'No Data Available');
  }}`,

  'No Results - No Data Available indicator displayed when no data': `${function(
    client,
  ) {
    // December 31, 2022 no results
    const queryString = '?now=2022-12-31T12&p=geographic&l=MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Coastlines&t=2022-12-31&v=-91.125,-53.3671875,82.40625,59.8359375&download=MOD04_L2';
    client.url(client.globals.url + queryString);

    // 'No Data Available' indicator present
    client.expect
      .element('#indicator')
      .to.be.present.after(client.globals.timeout);
    client.expect
      .element('#indicator > span')
      .to.have.text.equal('No Data Available')
      .after(client.globals.timeout);

    // On Valid Data Select, 'No Data Available' indicator disappears and data layer is in sidebar
    // Click from year 2022 down to 2013
    for (let i = 0; i <= 8; i++) {
      client.click(downYearInputButton);
    }
    client.expect
      .element('#indicator')
      .to.not.be.visible.after(client.globals.timeout);
    client.expect
      .element('#wv-data-MOD04_L2MODIS_Terra_Aerosol')
      .to.be.visible.after(client.globals.timeout);

    // On Valid Data Select, 'No Data Available' indicator appears
    // Click from year 2013 up to 2022
    for (let i = 0; i <= 8; i++) {
      client.click(upYearInputButton);
    }
    client.expect.element('#indicator').to.be.present;
    client.expect
      .element('#indicator > span')
      .to.have.text.equal('No Data Available')
      .after(client.globals.timeout);

    // Click layers tab, indicator disappears
    client.click(layersTab);
    client.expect.element('#indicator').to.not.be.visible;

    // Click data download tab, 'No Data Available' indicator appears
    client.click(dataDownloadTabButton);
    client.expect.element('#indicator').to.be.visible;
    client.expect
      .element('#indicator > span')
      .to.have.text.equal('No Data Available')
      .after(client.globals.timeout);
  }}`,

  'No data in view - Zoom out or move map indicator displayed when no data in view': function(
    client,
  ) {
    // zoomed in so no data in view
    const queryString = '?p=geographic&l=MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Coastlines&t=2013-08-15&v=-115.09722044197,32.076037619082,-112.11113645759,34.018420431582&download=MOD04_L2';
    client.url(client.globals.url + queryString);

    // 'Zoom out or move map' indicator present
    client.expect
      .element('#indicator')
      .to.be.present.after(client.globals.timeout);
    client.expect
      .element('#indicator > span')
      .to.have.text.equal('Zoom out or move map')
      .after(client.globals.timeout);

    // Zoom out three times for a data point granule selection button to be visible and indicator disappears
    client.click(zoomOutButton);
    client.pause(750);
    client.click(zoomOutButton);
    client.pause(750);
    client.click(zoomOutButton);
    client.expect
      .element('#indicator')
      .to.not.be.visible.after(client.globals.timeout);

    // Zoom in data point granule selection button is not visible and indicator reappears
    client.click(zoomInButton);
    client.pause(750);
    client.click(zoomInButton);
    client.pause(750);
    client.click(zoomInButton);
    client.expect
      .element('#indicator')
      .to.be.visible.after(client.globals.timeout);

    // Click layers tab, indicator disappears
    client.click(layersTab);
    client.expect
      .element('#indicator')
      .to.not.be.visible.after(client.globals.timeout);

    // Click data download tab, 'No Data Available' indicator appears
    client.click(dataDownloadTabButton);
    client.expect.element('#indicator').to.be.visible;
    client.expect
      .element('#indicator > span')
      .to.have.text.equal('Zoom out or move map')
      .after(client.globals.timeout);
  },
  'Query Timeout - No results received yet dialog box displayed': `${function(
    client,
  ) {
    // query timeout
    const queryString = '?timeoutCMR=100&p=geographic&l=MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Coastlines&t=2013-09-29&v=-170.64093281444,-59.218903407221,20.468442185558,65.093596592779';
    client.url(client.globals.url + queryString);

    // Click Data Download tab and show 'No results received yet' dialog box
    client.waitForElementVisible(
      dataDownloadTabButton,
      client.globals.timeout,
      () => {
        client.click(dataDownloadTabButton);
        client.expect
          .element('.wv-dialog')
          .to.have.text.equal(
            'No results received yet. This may be due to a connectivity issue. Please try again later.',
          )
          .after(client.globals.timeout);
      },
    );
  }}`,
  after(client) {
    client.end();
  },
};
