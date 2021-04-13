const skipTour = require('../../reuseables/skip-tour.js');

const damsLayerQuerystring = '?v=-70.43215000968726,28.678203599725197,-59.81569241792232,31.62330063930118&l=GRanD_Dams,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor';
const damsLayerWMSZoomLevelQuerystring = '?v=-166.0537832499445,-8.893604135881553,79.78417648048394,59.303969410599414&l=GRanD_Dams,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor';

const TIME_LIMIT = 10000;

module.exports = {
  before: (client) => {
    skipTour.loadAndSkipTour(client, TIME_LIMIT);
  },
  'vector layer has pointer icon': (client) => {
    client.url(client.globals.url + damsLayerQuerystring);
    client.waitForElementVisible('#active-GRanD_Dams .fa-hand-pointer', TIME_LIMIT);
  },
  'vector layer click does not show alert when all vector layers are clickable': (client) => {
    const globalSelectors = client.globals.selectors;

    client.moveToElement('#wv-map-geographic', 400, 200)
      .mouseButtonClick(0);
    client.pause(200);
    client.expect.element(globalSelectors.notifyMessage).to.not.be.present;
  },
  'Vectors show alert when not clickable': (client) => {
    const globalSelectors = client.globals.selectors;

    client.url(client.globals.url + damsLayerWMSZoomLevelQuerystring);
    client.waitForElementVisible('#active-GRanD_Dams .fa-hand-pointer', TIME_LIMIT, () => {
      client.moveToElement('#wv-map-geographic', 400, 200)
        .mouseButtonClick(0);
      client.pause(200);
      client.expect.element(globalSelectors.notifyMessage).to.be.present;
      client.assert.containsText(
        globalSelectors.notifyMessage,
        'Vector features may not be clickable at all zoom levels.',
      );
    });
  },
  'clicking vector message shows modal': (client) => {
    const globalSelectors = client.globals.selectors;

    client.click(globalSelectors.notifyMessage);
    client.waitForElementVisible('.modal-content', TIME_LIMIT, () => {
      client.assert.containsText('.modal-content',
        'Vector features may not be clickable at all zoom levels.');
    });
  },

  // TODO tests for orbit tracks toggle on/off
  after: (client) => {
    client.end();
  },
};
