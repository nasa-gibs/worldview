const skipTour = require('../../reuseables/skip-tour.js');
const { switchProjection } = require('../../reuseables/switch-projection');

// using VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT
const granuleLayerQueryString = '?t=2020-07-23-T20%3A04%3A31Z&z=4&l=VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT,Reference_Labels(hidden),Reference_Features(hidden),Coastlines,VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor';
const granuleLayerQueryStringTenCount = '?t=2020-07-23-T20%3A04%3A31Z&z=4&l=VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT(count=10),Reference_Labels(hidden),Reference_Features(hidden),Coastlines,VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor';
const granuleLayerQueryStringKnownDateCoverage = '?v=-147.79391244284767,-57.26121492413991,28.690462557152337,60.58253507586009&t=2019-09-23-T17%3A27%3A03Z&z=4&l=VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT,Coastlines,MODIS_Terra_CorrectedReflectance_TrueColor';

const VIIRSNOAA20CRSidebarID = '#active-VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT';
const granuleLayerSidebarSettingsButton = `${VIIRSNOAA20CRSidebarID} > div.layer-main > div.layer-info > a.wv-layers-options`;
const granuleLayerSidebarToggleButton = `${VIIRSNOAA20CRSidebarID} .layer-granule-footprint-toggle`;
const granuleLayerSettingsDialog = '#layer_options_modal-viirs_noaa20_correctedreflectance_truecolor_granule_v1_nrt';
const granuleLayerSettingsGranuleCount = `${granuleLayerSettingsDialog} .wv-label-granule-count`;
const granuleLayerSettingsGranuleDateList = `${granuleLayerSettingsDialog} .layer-granule-date-draggable-list`;
const granuleLayerSettingsGranuleDateListResetButton = `${granuleLayerSettingsDialog} button.granule-list-reset-button`;

const granuleLayerSettingsGranuleDateListKnownFirst = `${granuleLayerSettingsGranuleDateList} > div > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > div:nth-child(1)`;
const granuleLayerSettingsGranuleDateListKnownLast = `${granuleLayerSettingsGranuleDateList} > div > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > div:nth-child(20)`;

const granuleLayerSettingsGranuleDateListKnownSecond = `${granuleLayerSettingsGranuleDateList} > div > div.simplebar-wrapper > div.simplebar-mask > div > div > div > div > div:nth-child(2)`;
const granuleLayerSettingsGranuleDateListKnownSecondButton = `${granuleLayerSettingsGranuleDateListKnownSecond} button.granule-date-item-top-button`;
const TIME_LIMIT = 10000;

module.exports = {
  before: (client) => {
    skipTour.loadAndSkipTour(client, TIME_LIMIT);
  },
  'granule layer has hover settings toggle in sidebar': (client) => {
    client.url(client.globals.url + granuleLayerQueryString);
    client.waitForElementVisible(granuleLayerSidebarToggleButton, TIME_LIMIT);
  },

  'granule layer count and date list are displayed within the layer settings dialog': (client) => {
    client.click(granuleLayerSidebarSettingsButton);
    client.waitForElementVisible(granuleLayerSettingsDialog, TIME_LIMIT);
    client.expect.element(granuleLayerSettingsGranuleCount).to.be.present;
    client.expect.element(granuleLayerSettingsGranuleDateList).to.be.present;
  },

  'default granule count is 20': (client) => {
    client.assert.containsText(granuleLayerSettingsGranuleCount, '20');
  },

  'no granules displayed in date list and no coverage message when no coverage is available': (client) => {
    client.assert.containsText(`${granuleLayerSettingsGranuleDateList} p.granule-date-item-no-granules-available`, 'No granules available.');
  },

  'uses count query string parameter of 10 to adjust granule count in layer settings': (client) => {
    client.url(client.globals.url + granuleLayerQueryStringTenCount);
    client.waitForElementVisible(granuleLayerSidebarToggleButton, TIME_LIMIT);
    client.click(granuleLayerSidebarSettingsButton);
    client.waitForElementVisible(granuleLayerSettingsDialog, TIME_LIMIT);
    client.assert.containsText(granuleLayerSettingsGranuleCount, '10');
  },

  'known granule layer coverage date list is correct': (client) => {
    client.url(client.globals.url + granuleLayerQueryStringKnownDateCoverage);
    client.waitForElementVisible(granuleLayerSidebarToggleButton, TIME_LIMIT);
    client.click(granuleLayerSidebarSettingsButton);
    client.waitForElementVisible(granuleLayerSettingsDialog, TIME_LIMIT);
    client.assert.containsText(granuleLayerSettingsGranuleDateListKnownFirst, '2019-09-23T17:24:00Z');
    client.assert.containsText(granuleLayerSettingsGranuleDateListKnownLast, '2019-09-23T13:42:00Z');
  },

  'granule list can be reordered': (client) => {
    client.url(client.globals.url + granuleLayerQueryStringKnownDateCoverage);
    client.waitForElementVisible(granuleLayerSidebarToggleButton, TIME_LIMIT);
    client.click(granuleLayerSidebarSettingsButton);
    client.waitForElementVisible(granuleLayerSettingsDialog, TIME_LIMIT);
    client.assert.containsText(granuleLayerSettingsGranuleDateListKnownFirst, '2019-09-23T17:24:00Z');
    client.assert.containsText(granuleLayerSettingsGranuleDateListKnownSecond, '2019-09-23T17:18:00Z');
    client.click(granuleLayerSettingsGranuleDateListKnownSecondButton);
    client.pause(1000);
    client.assert.containsText(granuleLayerSettingsGranuleDateListKnownFirst, '2019-09-23T17:18:00Z');
    client.assert.containsText(granuleLayerSettingsGranuleDateListKnownSecond, '2019-09-23T17:24:00Z');
  },

  'reordered granule list retained when switching projections': (client) => {
    switchProjection(client, 'arctic');
    client.waitForElementVisible(granuleLayerSidebarToggleButton, TIME_LIMIT);
    client.click(granuleLayerSidebarSettingsButton);
    client.waitForElementVisible(granuleLayerSettingsDialog, TIME_LIMIT);

    client.assert.containsText(granuleLayerSettingsGranuleDateListKnownFirst, '2019-09-23T17:18:00Z');
    client.assert.containsText(granuleLayerSettingsGranuleDateListKnownSecond, '2019-09-23T17:24:00Z');
    switchProjection(client, 'geographic');
    client.waitForElementVisible(granuleLayerSidebarToggleButton, TIME_LIMIT);
    client.click(granuleLayerSidebarSettingsButton);
    client.waitForElementVisible(granuleLayerSettingsDialog, TIME_LIMIT);

    client.assert.containsText(granuleLayerSettingsGranuleDateListKnownFirst, '2019-09-23T17:18:00Z');
    client.assert.containsText(granuleLayerSettingsGranuleDateListKnownSecond, '2019-09-23T17:24:00Z');
  },

  'granule date order resets to original sorted date order on click': (client) => {
    client.click(granuleLayerSettingsGranuleDateListResetButton);
    client.pause(1000);
    client.assert.containsText(granuleLayerSettingsGranuleDateListKnownFirst, '2019-09-23T17:24:00Z');
    client.assert.containsText(granuleLayerSettingsGranuleDateListKnownSecond, '2019-09-23T17:18:00Z');
  },

  after: (client) => {
    client.end();
  },
};
