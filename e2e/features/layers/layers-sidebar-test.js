const skipTour = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const damsLayerSelector = '?v=-70.43215000968726,28.678203599725197,-59.81569241792232,31.62330063930118&l=GRanD_Dams,Reference_Labels(hidden),Reference_Features(hidden),Coastlines,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor';
const TIME_LIMIT = 10000;

module.exports = {
  before: (client) => {
    skipTour.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Toggle layer Info': (client) => {
    client.click(localSelectors.infoButton);
    client.waitForElementVisible(localSelectors.infoDialog, 1000, (e) => {
      client.click(localSelectors.infoButton).pause(100);
      client.expect.element(localSelectors.infoDialog).to.not.be.present;
      client.click(localSelectors.infoButton).pause(1000);
      client.expect.element(localSelectors.infoDialog).to.be.present;
    });
  },
  'Toggle Layer Options': (client) => {
    client.click(localSelectors.optionsButton);
    client.waitForElementVisible(localSelectors.optionsDialog, 1000, (e) => {
      client.click(localSelectors.optionsButton).pause(100);
      client.expect.element(localSelectors.optionsDialog).to.not.be.present;
      client.click(localSelectors.optionsButton).pause(1000);
      client.expect.element(localSelectors.optionsDialog).to.be.present;
    });
  },
  'vector layer has pointer icon': (client) => {
    client.url(client.globals.url + damsLayerSelector);
    client.waitForElementVisible('#active-GRanD_Dams .fa-hand-pointer', TIME_LIMIT);
  },
  'clicking vector layer pointer shows modal': (client) => {
    client.click('#active-GRanD_Dams .fa-hand-pointer');
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
