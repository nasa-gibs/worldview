const skipTour = require('../../reuseables/skip-tour.js');
const {
  addLayers,
  addToMapButton,
  allCategoryHeader,
  floodsCategoryHeader,
  categoriesContainer,
  categoriesNav,
  correctedReflectanceCheckboxContainer,
  correctedReflectanceChecked,
  layerBrowseList,
  layerResultsCountText,
  layersAll,
  layerCheckBoxEnabled,
  layerDetails,
  layersSearchRow,
  layerDetailHeader,
  layerDetailsDateRange,
  layerSearchList,
  layerPickerBackButton,
  layersModalCloseButton,
  layersSearchField,
  aerosolOpticalDepth,
  scienceDisciplinesTab,
  headerForAOD,
  unavailableFilterToggle,
  unavailableFilterTooltipIcon,
  weldReflectanceCheckboxContainer,
  weldUnavailableTooltipIcon
} = require('../../reuseables/selectors.js');
const TIME_LIMIT = 10000;
const LAYER_TITLE = 'Total Aerosol Optical Thickness Scattering 550nm';
const MERRA_2_LAYER_ID = 'MERRA2_Total_Aerosol_Optical_Thickness_550nm_Scattering_Monthly';

module.exports = {
  before: (client) => {
    skipTour.loadAndSkipTour(client, TIME_LIMIT);
    client.url(client.globals.url + '?t=2013-05-15');
  },
  'Layer picker shows categories when first opened': (client) => {
    client.click(addLayers);
    client.waitForElementVisible(categoriesNav, TIME_LIMIT, (e) => {
      client.useCss().expect.element(categoriesContainer).to.be.present;
      client.useCss().expect.element('#legacy-all').to.be.present;
      client.useCss().expect.element('#air-quality').to.be.present;
      client.useCss().expect.element('#ash-plumes').to.be.present;
      client.useCss().expect.element('#drought').to.be.present;
      client.useCss().expect.element('#fires').to.be.present;
      client.useCss().expect.element('#floods').to.be.present;
      client.useCss().expect.element('#shipping').to.be.present;
      client.useCss().expect.element('#dust-storms').to.be.present;
      client.useCss().expect.element('#severe-storms').to.be.present;
      client.useCss().expect.element('#smoke-plumes').to.be.present;
      client.useCss().expect.element('#vegetation').to.be.present;
      client.useCss().expect.element('#legacy-other').to.be.present;
    });
  },
  'Enabled Corrected Reflectance layers are shown as checked': (client) => {
    client.click(allCategoryHeader);
    client.waitForElementVisible(layerBrowseList, TIME_LIMIT, (e) => {
      client.click('#accordion-legacy-all-corrected-reflectance');
      client.waitForElementVisible(correctedReflectanceCheckboxContainer, TIME_LIMIT, (e) => {
        client
          .useCss()
          .expect.element(correctedReflectanceChecked).to.be.present;
      });
    });
  },
  '"Unavailable" layers show unavailable icon and tooltip': (client) => {
    client.click('#landsat-weld-1-source-Nav');
    client.waitForElementVisible(weldReflectanceCheckboxContainer, TIME_LIMIT, (e) => {
      client.moveToElement(weldUnavailableTooltipIcon, 2, 2, (e) => {
        client.waitForElementVisible('.tooltip', TIME_LIMIT, (e) => {
          client.useCss().expect.element('.tooltip').to.be.present;
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
    client.useCss().assert.cssClassPresent(layersSearchRow, 'selected');
    client.useCss().assert.containsText(layerDetailHeader, 'Ozone');
    client.useCss().expect.element('.layer-preview').to.be.present;
  },
  'Add layer button and list item checbox are in sync': (client) => {
    const checkBox = '.search-row.layers-all-layer.selected .wv-checkbox';
    client.click(addToMapButton);
    client.pause(200);
    client.useCss().assert.cssClassPresent(checkBox, 'checked');
    client.useCss().assert.containsText(addToMapButton, 'Remove Layer');
    client.click(checkBox);
    client.pause(200);
    client.useCss().assert.containsText(addToMapButton, 'Add Layer');
    client.useCss().assert.not.cssClassPresent(checkBox, 'checked');
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
      client.pause(5000);
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
        client.useCss().expect.element('.tooltip').to.be.present;
      });
    });
  },
  'Closing and reopening layer picker restores state.': (client) => {
    // First, select a row and confirm details are showing
    client.click(layersSearchRow);
    client.waitForElementVisible(layerDetailHeader, TIME_LIMIT, (e) => {
      client.assert.containsText(layerDetailHeader, 'Corrected Reflectance');

      // Close the modal
      client.click(layersModalCloseButton).pause(2000);
      client.useCss().expect.element(layersAll).to.not.be.present;

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
    client.setValue(layersSearchField, MERRA_2_LAYER_ID);
    client.waitForElementVisible(layersSearchRow, TIME_LIMIT, (e) => {
      client
        .useCss()
        .assert.containsText(layersAll, LAYER_TITLE);
      client
        .useCss()
        .assert.containsText(layersAll, 'MERRA-2');
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
  'Switching to "Science Disciplines" tab updates category choices': (client) => {
    client.click(scienceDisciplinesTab);
    client.pause(200);
    client.useCss().expect.element('#scientific-all').to.be.present;
    client.useCss().expect.element('#atmosphere').to.be.present;
    client.useCss().expect.element('#biosphere').to.be.present;
    client.useCss().expect.element('#cryosphere').to.be.present;
    client.useCss().expect.element('#human-dimensions').to.be.present;
    client.useCss().expect.element('#land-surface').to.be.present;
    client.useCss().expect.element('#oceans').to.be.present;
    client.useCss().expect.element('#spectral-engineering').to.be.present;
    client.useCss().expect.element('#terrestrial-hydrosphere').to.be.present;
    client.useCss().expect.element('#scientific-other').to.be.present;
  },

  // 'Help text indicating all layers being filtered out': (client) => {
  //   client.url(client.globals.url + '?t=2020-2-14');
  //   client.click(addLayers);
  //   client.setValue(layersSearchField, 'grace');
  //   client.waitForElementVisible('.no-results', TIME_LIMIT, (e) => {
  //     client.assert.containsText('.no-results', 'No layers found!');
  //     client.click('.remove-filters');
  //     client.waitForElementVisible('layersSearchRow', TIME_LIMIT, (e) => {
  //       client.expect.elements(layersSearchRow).count.to.equal(1);
  //       client.assert.containsText(layerDetailHeader, 'Liquid Water Equivalent Thickness');
  //     });
  //   });
  // },

  // 'Browsing Layers by Category: Aerosol Optical Depth': (client) => {
  //   client.click(addLayers).pause(2000);
  //   client.click(aerosolOpticalDepth);
  //   client.waitForElementVisible(
  //     headerForAOD,
  //     20000,
  //     (e) => {
  //     // This is a very slow process
  //     /* Not found
  //     client.click('[aria-labelledby="accordion-legacy-all-aerosol-optical-depth"] > ul > li:nth-child(3) > a')
  //       .pause(1000);
  //       */
  //       client
  //         .useCss()
  //         .assert.containsText(
  //           '#modisterraandaquacombinedvalueaddedaerosolopticaldepth',
  //           'MODIS (Terra and Aqua) Combined Value-Added Aerosol Optical Depth'
  //         );
  //     });
  // },
  after: (client) => {
    client.end();
  }
};
