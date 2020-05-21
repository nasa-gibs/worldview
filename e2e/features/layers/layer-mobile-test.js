const skipTour = require('../../reuseables/skip-tour.js');
const { assertCategories, assertDefaultLayers } = require('../../reuseables/layer-picker.js');

const filterButton = '.btn.filter-button';
const resetButton = '.btn.clear-filters';
const applyButton = '.btn.apply-facets';
const layersSearchField = 'input#layers-search-input';
const categoriesNav = '#categories-nav';
const layerSearchList = '.layer-list-container.search';
const layersSearchRow = '.search-row.layers-all-layer';
const layerPickerBackButton = '#layer-search .back-button';
const layerDetails = '.layer-detail-container';
const layerDetailHeader = '.layer-detail-container .layers-all-header';
const addLayers = '#layers-add';
const addToMapButton = '.layer-detail-container .add-to-map-btn';
const layersModalCloseButton = '.custom-layer-dialog .modal-header .close';
const aodMeasurement = '#layer-category-item-legacy-all-aerosol-optical-depth';
const aodMeasurementContents = '#accordion-legacy-all-aerosol-optical-depth';
const aodCheckboxMODIS = '#checkbox-case-MODIS_Combined_Value_Added_AOD';
const aodCheckboxMAIAC = '#checkbox-case-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth';
const aodCheckbox = '#checkbox-case-MODIS_Aqua_Aerosol';
const collapsedLayerButton = '#accordionTogglerButton';
const layerCount = '.layer-count.mobile';
const layerContainer = '.layer-container.sidebar-panel';
const sourceMetadataCollapsed = '.source-metadata.overflow';
const sourceMetadataExpanded = '.source-metadata';
const aquaTerraModisHeader = '#modisterraandaquacombinedvalueaddedaerosolopticaldepth';
const maiacHeader = '#maiacaerosolopticaldepth';
const aquaModisTab = '#aqua-modis-1-source-Nav';
const sourceTabs = '.source-nav-item';
const aodSearchRow = '#MODIS_Aqua_Aerosol-search-row';
const aodSearchCheckbox = '#MODIS_Aqua_Aerosol-search-row > .wv-checkbox';
const availableFacetLabel = '#availableAtDate-facet .sui-boolean-facet__option-input-wrapper';
const categoryOceansFacetLabel = '#categories-facet [for="example_facet_CategoryOceans"]';
const categoryFacetCollapseToggle = '#categories-facet .facet-collapse-toggle';
const sourcesDMSPFacetLabel = '#sources-facet [for="example_facet_SourceDMSP-F16/SSMIS"';

const TIME_LIMIT = 10000;

module.exports = {
  before: (c) => {
    skipTour.loadAndSkipTour(c, TIME_LIMIT);
    c.url(`${c.globals.url}?t=2013-05-15`);
    c.resizeWindow(375, 667); // iPhone 6/7/8 dimensions
  },
  'Initial state indicates layer count': (c) => {
    c.waitForElementVisible(collapsedLayerButton, TIME_LIMIT, (e) => {
      c.expect.element(layerCount).to.be.present;
      c.assert.containsText(layerCount, '7');
    });
  },
  'Expand layer list and show default layers': (c) => {
    c.click(collapsedLayerButton);
    c.waitForElementVisible(layerContainer, TIME_LIMIT, assertDefaultLayers(c));
  },
  'Open product picker and show categories by defulat': (c) => {
    c.click(addLayers);
    c.waitForElementVisible(categoriesNav, TIME_LIMIT, assertCategories(c));
  },
  'Clicking a measurement': (c) => {
    c.click(aodMeasurement);
    c.waitForElementVisible(aodMeasurementContents, TIME_LIMIT, (e) => {
      c.expect.element(sourceMetadataCollapsed).to.be.present;
      // Checkboxes for two layers are visible
      c.expect.element(aodCheckboxMODIS).to.be.present;
      c.expect.element(aodCheckboxMAIAC).to.be.present;
      c.assert.not.cssClassPresent(aodCheckboxMODIS, 'unavailable');
      // Indicate that MAIAC layer has no available coverage
      c.assert.cssClassPresent(aodCheckboxMAIAC, 'unavailable');
      c.expect.elements(sourceTabs).count.to.equal(8);
    });
  },
  'Expanding measurement details': (c) => {
    c.click('.ellipsis');
    c.waitForElementVisible(sourceMetadataExpanded, TIME_LIMIT, (e) => {
      c.assert.containsText(aquaTerraModisHeader, 'MODIS (Terra and Aqua) Combined Value-Added Aerosol Optical Depth');
      c.assert.containsText(maiacHeader, 'MAIAC Aerosol Optical Depth');
      c.expect.elements('.source-metadata > p').count.to.equal(7);
      c.expect.element('.ellipsis.up').to.be.present;
    });
  },
  'Collapsing measurement details': (c) => {
    c.click('.ellipsis.up').pause(250);
    c.assert.cssClassPresent('.source-metadata', 'overflow');
  },
  'Switching source tabs': (c) => {
    c.click(aquaModisTab).pause(250);
    c.expect.element(aodCheckbox).to.be.present;
    c.expect.element('h3#aerosolopticaldepth').to.be.present;
    c.assert.containsText('h3#aerosolopticaldepth', 'Aerosol Optical Depth');
    c.click(aodCheckbox);
  },
  'Back button returns to categories': (c) => {
    c.click(layerPickerBackButton);
    c.waitForElementVisible(categoriesNav, TIME_LIMIT, assertCategories(c));
  },
  'Search button changes to facet selection': (c) => {
    c.click(filterButton);
    c.waitForElementVisible('.facet-container', TIME_LIMIT, (e) => {
      c.click(availableFacetLabel);
      c.click(categoryOceansFacetLabel);
      c.click(categoryFacetCollapseToggle);
      // TODO verify "+ More button reveals additional choices"
      // TODO verify collapsing sections works
      c.click(sourcesDMSPFacetLabel);
      c.click(applyButton);
      c.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
        c.expect.elements(layersSearchRow).count.to.equal(8);
      });
      c.click(resetButton);
    });
  },
  'Searching for layers': (c) => {
    c.setValue(layersSearchField, 'aerosol optical depth');
    c.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
      c.expect.elements(layersSearchRow).count.to.equal(17);
      c.assert.attributeEquals('.search-row .checked input', 'id', 'MODIS_Aqua_Aerosol-checkbox');
    });
  },
  'Viewing details for search results': (c) => {
    c.click(aodSearchRow);
    c.waitForElementVisible(layerDetails, TIME_LIMIT, (e) => {
      c.assert.containsText(layerDetailHeader, 'Aerosol Optical Depth');
      c.assert.containsText(addToMapButton, 'Remove Layer');
    });
  },
  'Add to layer button and checkbox are in sync': (c) => {
    // Remove the layer
    c.click(addToMapButton).pause(200);
    c.assert.not.cssClassPresent(aodSearchCheckbox, 'checked');
    c.assert.containsText(addToMapButton, 'Add Layer');
    // Add it again
    c.click(aodSearchCheckbox).pause(200);
    c.assert.containsText(addToMapButton, 'Remove Layer');
    c.assert.cssClassPresent(aodSearchCheckbox, 'checked');
  },
  'Clicking the selected row deselects it and hides the details': (c) => {
    c.click(aodSearchRow).pause(300);
    c.expect.element(layerDetails).to.not.be.present;
    c.assert.not.cssClassPresent(aodSearchRow, 'selected');
    c.click(aodSearchRow).pause(300);
    c.assert.cssClassPresent(aodSearchRow, 'selected');
  },
  'Close product picker and confirm added layers show in sidebar': (c) => {
    c.click(layersModalCloseButton).pause(200);
    c.expect.element('#active-MODIS_Aqua_Aerosol').to.be.present;
  },
  'Collapse sidebar and confirm layer count updated': (c) => {
    c.click('.toggleIconHolder').pause(200);
    c.expect.element(layerCount).to.be.present;
    c.assert.containsText(layerCount, '8');
  },
  after: (c) => {
    c.end();
  },
};
