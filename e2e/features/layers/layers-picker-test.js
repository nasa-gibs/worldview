const skipTour = require('../../reuseables/skip-tour.js');
const layersSearchField = 'input#layers-search-input';
const categoriesContainer = '.category-masonry-case';
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
const aodCheckboxMODIS = '#checkbox-case-MODIS_Combined_Value_Added_AOD';
const aodCheckboxMAIAC = '#checkbox-case-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth';
const correctedReflectanceCheckboxContainer = '#checkbox-case-MODIS_Aqua_CorrectedReflectance_TrueColor';
const correctedReflectanceChecked = '#checkbox-case-MODIS_Aqua_CorrectedReflectance_TrueColor .wv-checkbox.checked';
const weldReflectanceCheckboxContainer = '#checkbox-case-Landsat_WELD_CorrectedReflectance_TrueColor_Global_Monthly';
const weldUnavailableTooltipIcon = '#checkbox-case-Landsat_WELD_CorrectedReflectance_TrueColor_Global_Monthly #availability-info';
const unavailableFilterToggle = '.header-filter-container .react-switch-label';
const unavailableFilterTooltipIcon = '.header-filter-container #availability-filter';
const scienceDisciplinesTab = '#categories-nav .nav-item:nth-child(2)';
const aodSidebarLayer = '#active-MODIS_Combined_Value_Added_AOD';
const aodMAIACSidebarLayer = '#active-MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth';
const projectionButton = '#wv-proj-button';
const TIME_LIMIT = 10000;

const assertCategories = (client) => {
  return () => {
    client.expect.element(categoriesContainer).to.be.present;
    client.expect.element('#legacy-all').to.be.present;
    client.expect.element('#air-quality').to.be.present;
    client.expect.element('#ash-plumes').to.be.present;
    client.expect.element('#drought').to.be.present;
    client.expect.element('#fires').to.be.present;
    client.expect.element('#floods').to.be.present;
    client.expect.element('#shipping').to.be.present;
    client.expect.element('#dust-storms').to.be.present;
    client.expect.element('#severe-storms').to.be.present;
    client.expect.element('#smoke-plumes').to.be.present;
    client.expect.element('#vegetation').to.be.present;
    client.expect.element('#legacy-other').to.be.present;
  };
};

module.exports = {
  before: (client) => {
    skipTour.loadAndSkipTour(client, TIME_LIMIT);
    client.url(client.globals.url + '?t=2013-05-15');
  },
  'Layer picker shows categories when first opened': (client) => {
    client.click(addLayers);
    client.waitForElementVisible(categoriesNav, TIME_LIMIT, assertCategories(client));
  },
  'Enabled Corrected Reflectance layers are shown as checked': (client) => {
    client.click(allCategoryHeader);
    client.waitForElementVisible(layerBrowseList, TIME_LIMIT, (e) => {
      client.click('#accordion-legacy-all-corrected-reflectance');
      client.waitForElementVisible(correctedReflectanceCheckboxContainer, TIME_LIMIT, (e) => {
        client.expect.element(correctedReflectanceChecked).to.be.present;
      });
    });
  },
  '"Unavailable" layers show unavailable icon and tooltip': (client) => {
    client.click('#landsat-weld-1-source-Nav');
    client.waitForElementVisible(weldReflectanceCheckboxContainer, TIME_LIMIT, (e) => {
      client.moveToElement(weldUnavailableTooltipIcon, 2, 2, (e) => {
        client.waitForElementVisible('.tooltip', TIME_LIMIT, (e) => {
          client.expect.element('.tooltip').to.be.present;
        });
      });
    });
  },
  'Entering search text transitions to search mode': (client) => {
    client.setValue(layersSearchField, 'ozone');
    client.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
      client.expect.elements(layersSearchRow).count.to.equal(6);
    });
  },
  'Updating input changes results': (client) => {
    client.clearValue(layersSearchField);
    client.setValue(layersSearchField, 'ozone day');
    client.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
      client.expect.elements(layersSearchRow).count.to.equal(1);
    });
  },
  'A single result is automatically selected from the list': (client) => {
    client.assert.cssClassPresent(layersSearchRow, 'selected');
    client.assert.containsText(layerDetailHeader, 'Ozone');
    client.expect.element('.layer-preview').to.be.present;
  },
  'Add layer button and list item checbox are in sync': (client) => {
    const checkBox = '.search-row.layers-all-layer.selected .wv-checkbox';
    client.click(addToMapButton);
    client.pause(200);
    client.assert.cssClassPresent(checkBox, 'checked');
    client.assert.containsText(addToMapButton, 'Remove Layer');
    client.click(checkBox);
    client.pause(200);
    client.assert.containsText(addToMapButton, 'Add Layer');
    client.assert.not.cssClassPresent(checkBox, 'checked');
  },
  'Search for "nothing" returns no results': (client) => {
    client.clearValue(layersSearchField);
    client.setValue(layersSearchField, 'nothing');
    client.waitForElementVisible('.no-results', TIME_LIMIT, (e) => {
      client.assert.containsText('.no-results', 'No layers found!');
    });
  },
  'Unavailable filter removes items not available from list by default': (client) => {
    client.clearValue(layersSearchField);
    client.setValue(layersSearchField, '(True');
    client.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
      client.expect.elements(layersSearchRow).count.to.equal(4);
      client.assert
        .containsText(
          layerResultsCountText,
          'Showing 4 results(1 hidden by filters)'
        );
    });
  },
  'Disabling unavailable filter updates list': (client) => {
    client.click(unavailableFilterToggle);
    client.pause(200);
    client.expect.elements(layersSearchRow).count.to.equal(5);
    client
      .assert
      .containsText(layerResultsCountText, 'Showing 5 results');
    client.moveToElement(unavailableFilterTooltipIcon, 2, 2, (e) => {
      client.waitForElementVisible('.tooltip', TIME_LIMIT, (e) => {
        client.expect.element('.tooltip').to.be.present;
      });
    });
  },
  'Closing and reopening layer picker restores state.': (client) => {
    // First, select a row and confirm details are showing
    client.click(layersSearchRow);
    client.waitForElementVisible(layerDetailHeader, TIME_LIMIT, (e) => {
      client.assert.containsText(layerDetailHeader, 'Corrected Reflectance');

      // Close the modal
      client.click(layersModalCloseButton);
      client.expect.element(layersAll).to.not.be.present;

      // Now reopen modal and confirm state is just as we left it
      client.click(addLayers);
      client.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
        client.expect.elements(layersSearchRow).count.to.equal(5);
        client
          .assert
          .containsText(layerResultsCountText, 'Showing 5 results');
        client.expect.element(layerDetails).to.be.present;
        client.assert.containsText(layerDetailHeader, 'Corrected Reflectance');
        client.expect.element(layerDetailsDateRange).to.be.present;
      });
    });
  },
  'Finding layer by ID with search': (client) => {
    client.clearValue(layersSearchField);
    client.setValue(
      layersSearchField,
      'MERRA2_Total_Aerosol_Optical_Thickness_550nm_Scattering_Monthly'
    );
    client.waitForElementVisible(layersSearchRow, TIME_LIMIT, (e) => {
      client.assert.containsText(layersAll, 'Total Aerosol Optical Thickness Scattering 550nm');
      client.assert.containsText(layersAll, 'MERRA-2');
    });
  },
  'Back button returns to main selection and clears search input': (client) => {
    client.waitForElementVisible(layerPickerBackButton, TIME_LIMIT, (e) => {
      client.click(layerPickerBackButton);
      client.getValue(layersSearchField, (result) => {
        client.assert.equal(result.value, '');
      });
    });
  },
  'Switching to "Science Disciplines" tab updates category/measurement choices': (client) => {
    client.click(scienceDisciplinesTab);
    client.pause(200);
    client.expect.element('#scientific-all').to.be.present;
    client.expect.element('#atmosphere').to.be.present;
    client.expect.element('#biosphere').to.be.present;
    client.expect.element('#cryosphere').to.be.present;
    client.expect.element('#human-dimensions').to.be.present;
    client.expect.element('#land-surface').to.be.present;
    client.expect.element('#oceans').to.be.present;
    client.expect.element('#spectral-engineering').to.be.present;
    client.expect.element('#terrestrial-hydrosphere').to.be.present;
    client.expect.element('#scientific-other').to.be.present;
  },
  'Selecting a measurement from the grid shows sources and details for first source': (client) => {
    client.click(aodMeasurement);
    client.waitForElementVisible(aodMeasurementContents, TIME_LIMIT, (e) => {
      client.waitForElementVisible(layerBrowseDetail, TIME_LIMIT, (e) => {
        client
          .assert
          .containsText(layerDetailHeader, 'Aqua and Terra/MODIS');

        // Checkboxes for two layers are visible
        client.expect.element(aodCheckboxMODIS).to.be.present;
        client.expect.element(aodCheckboxMAIAC).to.be.present;
        client
          .assert.not
          .cssClassPresent(aodCheckboxMODIS, 'unavailable');
        // Indicate that MAIAC layer has no available coverage
        client
          .assert
          .cssClassPresent(aodCheckboxMAIAC, 'unavailable');
      });
    });
  },
  'Selecting layers from product picker adds them to the sidebar/map': (client) => {
    client.click(aodCheckboxMODIS);
    client.click(aodCheckboxMAIAC);
    client.click(layersModalCloseButton);
    client.expect.element(aodSidebarLayer).to.be.present;
    client.expect.element(aodMAIACSidebarLayer).to.be.present;
  },
  'Collapsed sidebar shows updated layer count': (client) => {
    client.click('.toggleIconHolder');
    client.assert.containsText('.layer-count', '8 Layers');
    client.click('#accordionTogglerButton');
  },
  'When no results returned due to filters, help text shows and user can click to remove all': (client) => {
    client.url(client.globals.url + '?t=2020-2-14');
    client.click(addLayers);
    client.setValue(layersSearchField, 'grace');
    client.waitForElementVisible('.no-results', TIME_LIMIT, (e) => {
      client.assert.containsText('.no-results', 'No layers found!');
      client.click('.remove-filters');
      client.waitForElementVisible(layersSearchRow, TIME_LIMIT, (e) => {
        client.expect.elements(layersSearchRow).count.to.equal(1);
        client.assert.containsText(layerDetailHeader, 'Liquid Water Equivalent Thickness');
        client.click(layersModalCloseButton);
      });
    });
  },
  'When in arctic projection, go straight to measurements browse list': (client) => {
    const arcticbutton = '#change-arctic-button';
    client.click(projectionButton);
    client.waitForElementVisible(arcticbutton, TIME_LIMIT, (e) => {
      client.click(arcticbutton).pause(200);
      client.click(addLayers).waitForElementVisible(layerBrowseList, TIME_LIMIT, (e) => {
        client.expect.element(layerBrowseDetail).to.be.present;
        client.assert.containsText('.no-results', 'Select a measurement to view details here!');
      });
    });
  },
  'Searching in arctic projection': (client) => {
    client.setValue(layersSearchField, 'sea');
    client.waitForElementVisible(layerSearchList, TIME_LIMIT, (e) => {
      client.expect.elements(layersSearchRow).count.to.equal(10);
      client.assert.containsText(layerResultsCountText, 'Showing 10 results(5 hidden by filters)');
      // TODO enable after fix
      // client.click(layerPickerBackButton);
      // client.click(addLayers).waitForElementVisible(layerBrowseList, TIME_LIMIT, (e) => {
      //   client.expect(layerBrowseDetail).to.be.present;
      // });
      client.click(layersModalCloseButton);
    });
  },
  'Switching back to geographic projetion, categories appear': (client) => {
    const geographicButton = '#change-geographic-button';
    client.click(projectionButton);
    client.waitForElementVisible(geographicButton, TIME_LIMIT, (e) => {
      client.click(geographicButton).pause(200);
      client.click(addLayers);
      client.waitForElementVisible(categoriesNav, TIME_LIMIT, assertCategories(client));
    });
  },
  after: (client) => {
    client.end();
  }
};
