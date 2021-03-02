const { loadAndSkipTour } = require('../../reuseables/skip-tour.js');
const { checkElementOrdering } = require('../../reuseables/check-element-ordering.js');
const {
  infoButton,
  infoDialog,
  optionsButton,
  optionsDialog,
  groupCheckbox,
  addLayers,
  categoriesNav,
  layersSearchField,
  layerSearchList,
  viirsFiresCheckbox,
  layersModalCloseButton,
  firesGroup,
  firesLayer,
  firesRemove,
  aodGroup,
  aodGroupHeader,
  overlaysGroup,
  overlaysGroupHeader,
  baselayersGroup,
  baselayersGroupHeader,
  groupOptionsBtn,
  groupShow,
  groupHide,
  groupRemove,
  layerHidden,
  layerVisible,
  sidebarContainer,
  groupedOverlaysAllLayers,
} = require('../../reuseables/selectors.js');

const vectorsQueryString = '?v=-70.43215000968726,28.678203599725197,-59.81569241792232,31.62330063930118&l=GRanD_Dams,Reference_Labels(hidden),Reference_Features(hidden),Coastlines,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor';
const TIME_LIMIT = 10000;
const someGroupsQueryString = '?l=MODIS_Combined_Value_Added_AOD,MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth,Reference_Labels(hidden),Reference_Features,MODIS_Terra_CorrectedReflectance_TrueColor&lg=true';
const twoGroupsQueryString = '?v=-107.15747724134027,-81.6706340523014,47.81381180183274,89.12472754295932&l=VIIRS_SNPP_Thermal_Anomalies_375m_All,VIIRS_NOAA20_Thermal_Anomalies_375m_All,MODIS_Combined_Value_Added_AOD,MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth,Reference_Features,MODIS_Terra_CorrectedReflectance_TrueColor&lg=true';
const mixedLayersGroupsDisabledQueryString = '?v=-107.15747724134027,-81.6706340523014,47.81381180183274,89.12472754295932&l=Reference_Features,VIIRS_SNPP_Thermal_Anomalies_375m_All,MODIS_Combined_Value_Added_AOD,VIIRS_NOAA20_Thermal_Anomalies_375m_All,MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth,MODIS_Terra_CorrectedReflectance_TrueColor&lg=false';
const mixedLayerIdOrder = [
  'active-Reference_Features',
  'active-VIIRS_SNPP_Thermal_Anomalies_375m_All',
  'active-MODIS_Combined_Value_Added_AOD',
  'active-VIIRS_NOAA20_Thermal_Anomalies_375m_All',
  'active-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth',
];
const groupedLayerIdOrder = [
  'active-Reference_Features',
  'active-VIIRS_SNPP_Thermal_Anomalies_375m_All',
  'active-VIIRS_NOAA20_Thermal_Anomalies_375m_All',
  'active-MODIS_Combined_Value_Added_AOD',
  'active-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth',
];
const ungroupedReorderdLayerIdOrder = [
  'active-MODIS_Combined_Value_Added_AOD',
  'active-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth',
  'active-VIIRS_SNPP_Thermal_Anomalies_375m_All',
  'active-VIIRS_NOAA20_Thermal_Anomalies_375m_All',
  'active-Reference_Features',
];

module.exports = {
  before: (c) => {
    loadAndSkipTour(c, TIME_LIMIT);
  },

  // Individual layer interactions
  'Toggle layer Info': (c) => {
    c.url(c.globals.url + twoGroupsQueryString);
    c.moveToElement(firesLayer, 0, 0);
    c.waitForElementVisible(infoButton, TIME_LIMIT);
    c.click(infoButton);
    c.waitForElementVisible(infoDialog, TIME_LIMIT);
    c.click(infoButton).pause(100);
    c.expect.element(infoDialog).to.not.be.present;
  },
  'Toggle Layer Options': (c) => {
    c.moveToElement(firesLayer, 0, 0);
    c.waitForElementVisible(optionsButton, TIME_LIMIT);
    c.click(optionsButton);
    c.waitForElementVisible(optionsDialog, TIME_LIMIT);
    c.click(optionsButton).pause(100);
    c.expect.element(optionsDialog).to.not.be.present;
  },

  // Layer grouping
  'Layer groups are enabled by default': (c) => {
    c.expect.element(groupCheckbox).to.be.present;
    c.assert.attributeContains(groupCheckbox, 'checked', true);
  },

  'Adding a layer causes it to appear in the appropriate group': (c) => {
    c.url(c.globals.url + someGroupsQueryString);
    c.click(addLayers);
    c.waitForElementVisible(categoriesNav, TIME_LIMIT);
    c.setValue(layersSearchField, 'fires').pause(500);
    c.waitForElementVisible(layerSearchList, TIME_LIMIT);
    c.click(viirsFiresCheckbox).pause(500);
    c.click(layersModalCloseButton);
    c.expect.element(firesGroup).to.be.present;
    c.expect.element(firesLayer).to.be.present;
  },

  'Disabling groups puts all overlays into a single group': (c) => {
    c.click(groupCheckbox);
    c.waitForElementVisible(overlaysGroup, TIME_LIMIT);
    c.expect.element(firesLayer).to.be.present;
    c.expect.element(firesGroup).to.not.be.present;
    c.expect.elements(`${overlaysGroup} ul > li`).count.to.equal(5);
  },

  'Re-enabling groups restores grouping': (c) => {
    c.click(groupCheckbox);
    c.waitForElementVisible(firesGroup, TIME_LIMIT);
    c.expect.element(aodGroup).to.be.present;
    c.expect.elements(`${firesGroup} ul > li`).count.to.equal(1);
    c.expect.elements(`${aodGroup} ul > li`).count.to.equal(2);
  },

  'Removing the last layer in a group removes the group': (c) => {
    c.moveToElement(firesLayer, 0, 0);
    c.waitForElementVisible(firesRemove, TIME_LIMIT);
    c.click(firesRemove).pause(500);
    c.expect.element(firesGroup).to.not.be.present;
  },

  'Removing a group removes all layers and the group header': (c) => {
    c.url(c.globals.url + twoGroupsQueryString);
    c.waitForElementVisible(aodGroup, TIME_LIMIT);
    c.moveToElement(aodGroupHeader, 0, 0);
    c.waitForElementVisible(`${aodGroup} ${groupOptionsBtn}`);
    c.click(`${aodGroup} ${groupOptionsBtn}`).pause(200);
    c.click(`${aodGroup} ${groupRemove}`).pause(200);
    c.expect.element(aodGroup).to.not.be.present;
  },

  'Load with groups disabled from permalink': (c) => {
    c.url(c.globals.url + mixedLayersGroupsDisabledQueryString);
    c.expect.element(groupCheckbox).to.be.present;
    c.expect.element(groupCheckbox).to.not.have.attribute('checked');
    c.expect.element(firesGroup).to.not.be.present;
    c.expect.element(aodGroup).to.not.be.present;
    c.expect.element(overlaysGroup).to.be.present;
    c.expect.elements(`${overlaysGroup} ul > li`).count.to.equal(5);
  },

  'Load multiple groups from permalink': (c) => {
    c.url(c.globals.url + twoGroupsQueryString);
    c.expect.element(groupCheckbox).to.be.present;
    c.assert.attributeContains(groupCheckbox, 'checked', true);
    c.expect.element(firesGroup).to.be.present;
    c.expect.element(aodGroup).to.be.present;
    c.expect.elements(`${firesGroup} ul > li`).count.to.equal(2);
    c.expect.elements(`${aodGroup} ul > li`).count.to.equal(2);
  },

  'Hide all ...': (c) => {
    c.moveToElement(sidebarContainer, 0, 0);
    c.moveToElement(aodGroupHeader, 0, 0);
    c.waitForElementVisible(`${aodGroup} ${groupOptionsBtn}`);
    c.click(`${aodGroup} ${groupOptionsBtn}`).pause(200);
    c.click(`${aodGroup} ${groupHide}`).pause(200);
    c.expect.elements(`${aodGroup} ${layerHidden}`).count.to.equal(2);
    c.expect.elements(`${aodGroup} ${layerVisible}`).count.to.equal(0);
  },

  'Show all ...': (c) => {
    c.moveToElement(sidebarContainer, 0, 0);
    c.moveToElement(aodGroupHeader, 0, 0);
    c.waitForElementVisible(`${aodGroup} ${groupOptionsBtn}`);
    c.click(`${aodGroup} ${groupOptionsBtn}`).pause(200);
    c.click(`${aodGroup} ${groupShow}`).pause(200);
    c.expect.elements(`${aodGroup} ${layerHidden}`).count.to.equal(0);
    c.expect.elements(`${aodGroup} ${layerVisible}`).count.to.equal(2);
  },

  'Ungrouped: Removing baselayers/overlays removes the layers but not the header': (c) => {
    c.click(groupCheckbox);
    c.expect.element(groupCheckbox).to.not.have.attribute('checked');

    c.moveToElement(overlaysGroupHeader, 0, 0);
    c.waitForElementVisible(`${overlaysGroupHeader} ${groupOptionsBtn}`);
    c.click(`${overlaysGroup} ${groupOptionsBtn}`).pause(200);
    c.click(`${overlaysGroup} ${groupRemove}`).pause(200);

    c.moveToElement(baselayersGroupHeader, 0, 0);
    c.waitForElementVisible(`${baselayersGroupHeader} ${groupOptionsBtn}`);
    c.click(`${baselayersGroup} ${groupOptionsBtn}`).pause(200);
    c.click(`${baselayersGroup} ${groupRemove}`).pause(200);

    c.expect.element(overlaysGroup).to.be.present;
    c.expect.elements(`${overlaysGroup} ul > li`).count.to.equal(0);

    c.expect.element(baselayersGroup).to.be.present;
    c.expect.elements(`${baselayersGroup} ul > li`).count.to.equal(0);
  },

  'Re-ordering groups, then disabling groups keeps individual layer order': (c) => {
    c.url(c.globals.url + twoGroupsQueryString);
    c.waitForElementVisible(aodGroup, TIME_LIMIT);
    c.moveToElement(aodGroupHeader, 0, 0);
    c.mouseButtonDown(0).pause(200);
    c.moveTo(null, 50, 0).pause(200);
    c.moveTo(null, -50, -150).pause(200);
    c.mouseButtonUp(0).pause(1000);
    c.click(groupCheckbox).pause(200);
    checkElementOrdering(c, `${overlaysGroup} ul > li`, ungroupedReorderdLayerIdOrder);
  },

  // begin with "mixed" interspersed layers
  'Enabling groups re-orders layers into their groups': (c) => {
    c.url(c.globals.url + mixedLayersGroupsDisabledQueryString);
    c.waitForElementVisible(sidebarContainer, TIME_LIMIT);
    // confirm mixed layer ordering
    checkElementOrdering(c, `${overlaysGroup} ul > li`, mixedLayerIdOrder);
    c.click(groupCheckbox).pause(200);
    c.expect.element(aodGroup).to.be.present;
    c.expect.element(firesGroup).to.be.present;
    // confirm layers ordered by their groups
    checkElementOrdering(c, groupedOverlaysAllLayers, groupedLayerIdOrder);
  },

  'Immediately disabling groups restores mixed ordering': (c) => {
    c.click(groupCheckbox).pause(200);
    c.expect.element(aodGroup).to.not.be.present;
    c.expect.element(firesGroup).to.not.be.present;
    // confirm pre-group ordering
    checkElementOrdering(c, `${overlaysGroup} ul > li`, mixedLayerIdOrder);
  },

  'Making a change to grouped layers causes group ordering to be retained when ungrouped': (c) => {
    c.url(c.globals.url + mixedLayersGroupsDisabledQueryString);
    // Turn on groups
    c.click(groupCheckbox).pause(200);
    // Modify by setting AOD layers to hidden
    c.moveToElement(sidebarContainer, 0, 0);
    c.moveToElement(aodGroupHeader, 0, 0);
    c.waitForElementVisible(`${aodGroup} ${groupOptionsBtn}`);
    c.click(`${aodGroup} ${groupOptionsBtn}`).pause(200);
    c.click(`${aodGroup} ${groupHide}`).pause(200);
    // Turn off groups
    c.click(groupCheckbox).pause(200);
    // Confirm ungrouped layer order matches grouped order
    checkElementOrdering(c, `${overlaysGroup} ul > li`, groupedLayerIdOrder);
  },

  // Vector layers
  'vector layer has pointer icon': (c) => {
    c.url(c.globals.url + vectorsQueryString);
    c.waitForElementVisible('#active-GRanD_Dams .fa-hand-pointer', TIME_LIMIT);
  },
  'clicking vector layer pointer shows modal': (c) => {
    c.click('#active-GRanD_Dams .fa-hand-pointer');
    c.waitForElementVisible('.modal-content', TIME_LIMIT, (e) => {
      c.assert.containsText('.modal-content',
        'Vector features may not be clickable at all zoom levels.');
    });
  },
  // TODO tests for orbit tracks toggle on/off
  after: (c) => {
    c.end(c);
  },
};
