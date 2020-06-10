const { assertCategories } = require('../../reuseables/layer-picker.js');

const skipTour = require('../../reuseables/skip-tour.js');

const layersSearchField = 'input#layers-search-input';
const categoriesNav = '#categories-nav';
const allCategoryHeader = '#legacy-all .layer-category-name';
const layersAll = '.layers-all-layer';
const layerBrowseList = '.layer-list-container.browse';
const layerBrowseDetail = '.layer-detail-container.browse';
const layerSearchList = '.layer-list-container.search';
const layersSearchRow = '.search-row.layers-all-layer';
const layerPickerBackButton = '#layer-search .back-button';
const layerDetails = '.layer-detail-container';
const layerDetailsDateRange = '.source-metadata .layer-date-range';
const layerDetailHeader = '.layer-detail-container .layers-all-header';
const layerResultsCountText = '.header-filter-container .results-text';
const addLayers = '#layers-add';
const addToMapButton = '.layer-detail-container .add-to-map-btn';
const layersModalCloseButton = '.custom-layer-dialog .modal-header .close';
const aodMeasurement = '#layer-category-item-atmosphere-aerosol-optical-depth';
const aodMeasurementContents = '#accordion-atmosphere-aerosol-optical-depth .measure-row-contents';
const aodTabContentAquaMODIS = '#aerosol-optical-depth-aqua-modis';
const aodCheckboxMODIS = '#checkbox-case-MODIS_Combined_Value_Added_AOD';
const aodCheckboxMAIAC = '#checkbox-case-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth';
const aodCheckboxAquaMODIS = '#checkbox-case-MODIS_Aqua_Aerosol';
const aquaTerraMODISTab = '#aqua-terra-modis-0-source-Nav';
const aquaModisTab = '#aqua-modis-1-source-Nav';
const correctedReflectanceCheckboxContainer = '#checkbox-case-MODIS_Aqua_CorrectedReflectance_TrueColor';
const correctedReflectanceChecked = '#checkbox-case-MODIS_Aqua_CorrectedReflectance_TrueColor .wv-checkbox.checked';
const weldReflectanceCheckboxContainer = '#checkbox-case-Landsat_WELD_CorrectedReflectance_TrueColor_Global_Monthly';
const weldUnavailableTooltipIcon = '#checkbox-case-Landsat_WELD_CorrectedReflectance_TrueColor_Global_Monthly #availability-info';
const unavailableFilterToggle = '.sui-boolean-facet__option-label';
const unavailableFilterTooltipIcon = '#availableAtDate-facet svg.facet-tooltip';
const scienceDisciplinesTab = '#categories-nav .nav-item:nth-child(2)';
const aodSidebarLayer = '#active-MODIS_Combined_Value_Added_AOD';
const aodMAIACSidebarLayer = '#active-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth';
const projectionButton = '#wv-proj-button';
const TIME_LIMIT = 10000;

module.exports = {
  before: (c) => {
    skipTour.loadAndSkipTour(c, TIME_LIMIT);
    c.url(`${c.globals.url}?t=2013-05-15`);
  },
  'Layer picker shows categories when first opened': (c) => {
    c.click(addLayers);
    c.waitForElementVisible(categoriesNav, TIME_LIMIT, assertCategories(c));
  },
  'Enabled Corrected Reflectance layers are shown as checked': (c) => {
    c.click(allCategoryHeader);
    c.waitForElementVisible(layerBrowseList, TIME_LIMIT, (e) => {
      c.click('#accordion-legacy-all-corrected-reflectance');
      c.waitForElementVisible(correctedReflectanceCheckboxContainer, TIME_LIMIT, (e) => {
        c.expect.element(correctedReflectanceChecked).to.be.present;
      });
    });
  },
  '"Unavailable" layers show unavailable icon and tooltip': (c) => {
    c.click('#landsat-weld-1-source-Nav');
    c.waitForElementVisible(weldReflectanceCheckboxContainer, TIME_LIMIT, (e) => {
      c.moveToElement(weldUnavailableTooltipIcon, 2, 2, (e) => {
        c.waitForElementVisible('.tooltip', TIME_LIMIT, (e) => {
          c.expect.element('.tooltip').to.be.present;
        });
      });
    });
  },
  'Entering search text transitions to search mode': (c) => {
    c.setValue(layersSearchField, 'ozone');
    c.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
      c.expect.elements(layersSearchRow).count.to.equal(6);
    });
  },
  'Updating input changes results': (c) => {
    c.clearValue(layersSearchField);
    c.setValue(layersSearchField, 'ozone day');
    c.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
      c.expect.elements(layersSearchRow).count.to.equal(1);
    });
  },
  'Selecting a row shows the detail panel': (c) => {
    c.click('#MLS_O3_46hPa_Day-search-row');
    c.waitForElementVisible(layerDetails, TIME_LIMIT, (e) => {
      c.expect.element(layerDetailHeader).to.be.present;
    });
  },
  'Add layer button and list item checbox are in sync': (c) => {
    const checkBox = '.search-row.layers-all-layer.selected .wv-checkbox';
    c.click(addToMapButton);
    c.pause(200);
    c.assert.cssClassPresent(checkBox, 'checked');
    c.assert.containsText(addToMapButton, 'Remove Layer');
    c.click(checkBox);
    c.pause(200);
    c.assert.containsText(addToMapButton, 'Add Layer');
    c.assert.not.cssClassPresent(checkBox, 'checked');
  },
  'Search for "nothing" returns no results': (c) => {
    c.clearValue(layersSearchField);
    c.setValue(layersSearchField, 'nothing');
    c.waitForElementVisible('.no-results', TIME_LIMIT, (e) => {
      c.assert.containsText('.no-results', 'No layers found!');
    });
  },
  '"Visible" filter removes items not available from list, adds a chip': (c) => {
    c.clearValue(layersSearchField);
    c.setValue(layersSearchField, '(True');
    c.moveToElement(unavailableFilterTooltipIcon, 2, 2, (e) => {
      c.waitForElementVisible('.tooltip', TIME_LIMIT, (e) => {
        c.expect.element('.tooltip').to.be.present;
        // Move cursor off tooltip so it fades
        c.moveToElement(layerPickerBackButton, 2, 2);
        c.pause(1500);
      });
    });

    c.click(unavailableFilterToggle);
    c.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
      c.expect.elements(layersSearchRow).count.to.equal(4);
      c.assert.containsText(layerResultsCountText, 'Showing 4 out of');
      c.expect.element('.bag-o-chips').to.be.present;
      c.expect.elements('.filter-chip').count.to.equal(1);
    });
  },
  'Disabling unavailable filter updates list': (c) => {
    c.click(unavailableFilterToggle);
    c.pause(200);
    c.expect.elements(layersSearchRow).count.to.equal(6);
    c
      .assert
      .containsText(layerResultsCountText, 'Showing 6 out of');
  },
  'Closing and reopening layer picker restores state.': (c) => {
    // First, select a row and confirm details are showing
    c.click(layersSearchRow);
    c.waitForElementVisible(layerDetailHeader, TIME_LIMIT, (e) => {
      c.assert.containsText(layerDetailHeader, 'Corrected Reflectance');

      // Close the modal
      c.click(layersModalCloseButton);
      c.expect.element(layersAll).to.not.be.present;

      // Now reopen modal and confirm state is just as we left it
      c.click(addLayers);
      c.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
        c.expect.elements(layersSearchRow).count.to.equal(6);
        c
          .assert
          .containsText(layerResultsCountText, 'Showing 6 out of');
        c.expect.element(layerDetails).to.be.present;
        c.assert.containsText(layerDetailHeader, 'Corrected Reflectance');
        c.expect.element(layerDetailsDateRange).to.be.present;
      });
    });
  },
  'Finding layer by ID with search': (c) => {
    c.clearValue(layersSearchField);
    c.setValue(
      layersSearchField,
      'MERRA2_Total_Aerosol_Optical_Thickness_550nm_Scattering_Monthly',
    );
    c.waitForElementVisible(layersSearchRow, TIME_LIMIT, (e) => {
      c.assert.containsText(layersAll, 'Total Aerosol Optical Thickness Scattering 550nm');
      c.assert.containsText(layersAll, 'MERRA-2');
    });
  },
  'Back button returns to main selection and clears search input': (c) => {
    c.waitForElementVisible(layerPickerBackButton, TIME_LIMIT, (e) => {
      c.click(layerPickerBackButton);
      c.getValue(layersSearchField, (result) => {
        c.assert.equal(result.value, '');
      });
    });
  },
  'Switching to "Science Disciplines" tab updates category/measurement choices': (c) => {
    c.click(scienceDisciplinesTab);
    c.pause(200);
    c.expect.element('#scientific-all').to.be.present;
    c.expect.element('#atmosphere').to.be.present;
    c.expect.element('#biosphere').to.be.present;
    c.expect.element('#cryosphere').to.be.present;
    c.expect.element('#human-dimensions').to.be.present;
    c.expect.element('#land-surface').to.be.present;
    c.expect.element('#oceans').to.be.present;
    c.expect.element('#spectral-engineering').to.be.present;
    c.expect.element('#terrestrial-hydrosphere').to.be.present;
    c.expect.element('#scientific-other').to.be.present;
  },
  'Selecting a measurement from the grid shows sources and details for first source': (c) => {
    c.click(aodMeasurement);
    c.waitForElementVisible(aodMeasurementContents, TIME_LIMIT, (e) => {
      c.waitForElementVisible(layerBrowseDetail, TIME_LIMIT, (e) => {
        c
          .assert
          .containsText(layerDetailHeader, 'Aqua and Terra/MODIS');

        // Checkboxes for two layers are visible
        c.expect.element(aodCheckboxMODIS).to.be.present;
        c.expect.element(aodCheckboxMAIAC).to.be.present;
        // Indicate that MODIS Combined layer has no available coverage
        c
          .assert
          .cssClassPresent(aodCheckboxMODIS, 'unavailable list-group-item');
        // Indicate that MAIAC layer has no available coverage
        c
          .assert
          .cssClassPresent(aodCheckboxMAIAC, 'unavailable list-group-item');
      });
    });
  },
  'Available grid source layer measuremet does not have unavaiable coverage class': (c) => {
    // swith to Aqua/MODIS measurement nav item
    c.click(aquaModisTab);
    c.waitForElementVisible(aodTabContentAquaMODIS, TIME_LIMIT, (e) => {
      c
        .assert
        .containsText(layerDetailHeader, 'Aqua/MODIS');
      // Checkboxes for layer is visible
      c.expect.element(aodCheckboxAquaMODIS).to.be.present;
      // Avaialable layer does not have unavailable class
      c
        .assert
        .not
        .cssClassPresent(aodCheckboxAquaMODIS, 'unavailable');
      // switch back to previous 'Aqua and Terra/MODIS' measurement nav item
      c.click(aquaTerraMODISTab);
    });
  },
  'Selecting layers from product picker adds them to the sidebar/map': (c) => {
    c.waitForElementVisible(aodCheckboxMODIS, TIME_LIMIT, (e) => {
      c.click(aodCheckboxMODIS);
      c.click(aodCheckboxMAIAC);
      // Reset to category mode view for future test
      c.click(layerPickerBackButton);
      c.click(layersModalCloseButton);
      c.expect.element(aodSidebarLayer).to.be.present;
      c.expect.element(aodMAIACSidebarLayer).to.be.present;
    });
  },
  'Collapsed sidebar shows updated layer count': (c) => {
    c.click('.toggleIconHolder');
    c.assert.containsText('.layer-count', '9 Layers');
    c.click('#accordionTogglerButton');
  },
  'When switching arctic projection, go straight to measurements browse list if previously in category mode': (c) => {
    const arcticbutton = '#change-arctic-button';

    // Switch projection and confirm measurement view
    c.click(projectionButton);
    c.waitForElementVisible(arcticbutton, TIME_LIMIT, (e) => {
      c.click(arcticbutton).pause(200);
      c.click(addLayers).waitForElementVisible(layerBrowseList, TIME_LIMIT, (e) => {
        c.expect.element(layerBrowseDetail).to.be.present;
        c.assert.containsText('.no-results', 'Select a measurement to view details here!');
      });
    });
  },
  'Searching in arctic projection': (c) => {
    c.setValue(layersSearchField, 'sea');
    c.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
      c.expect.elements(layersSearchRow).count.to.equal(15);
      c.assert.containsText(layerResultsCountText, 'Showing 15 out of');
      c.click(layerPickerBackButton);
      c.waitForElementVisible(layerBrowseList, TIME_LIMIT, (e) => {
        c.expect.element(layerBrowseDetail).to.be.present;
      });
      c.click(layersModalCloseButton);
    });
  },
  'Switching back to geographic projetion, categories appear': (c) => {
    const geographicButton = '#change-geographic-button';
    c.click(projectionButton);
    c.waitForElementVisible(geographicButton, TIME_LIMIT, (e) => {
      c.click(geographicButton).pause(200);
      c.click(addLayers);
      c.waitForElementVisible(categoriesNav, TIME_LIMIT, assertCategories(c));
    });
  },
  after: (c) => {
    c.end();
  },
};
