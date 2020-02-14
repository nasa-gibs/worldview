const skipTour = require('../../reuseables/skip-tour.js');
const {
  addLayers,
  addToMapButton,
  allCategoryHeader,
  categoriesContainer,
  categoriesNav,
  correctedReflectanceCheckboxContainer,
  correctedReflectanceChecked,
  weldReflectanceCheckboxContainer,
  weldUnavailableTooltipIcon,
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
  headerForAOD,
  unavailableFilterToggle,
  unavailableFilterTooltipIcon

} = require('../../reuseables/selectors.js');
const TIME_LIMIT = 10000;
const LAYER_TITLE = 'Total Aerosol Optical Thickness Scattering 550nm';
const MERRA_2_LAYER_ID = 'MERRA2_Total_Aerosol_Optical_Thickness_550nm_Scattering_Monthly';

module.exports = {
  before: (client) => {
    skipTour.loadAndSkipTour(client, TIME_LIMIT);
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
          'Showing 4 results (1 hidden by filters)'
        );
    });
  },
  'Disabling unavailable filter updates list': (client) => {
    client.click(unavailableFilterToggle);
    client.pause(200);
    client.expect.elements(layersSearchRow).count.to.equal(5);
    client.assert
      .containsText(
        layerResultsCountText,
        'Showing 5 results'
      );
    client.moveToElement(unavailableFilterTooltipIcon, 2, 2, (e) => {
      client.waitForElementVisible('.tooltip', TIME_LIMIT, (e) => {
        client.useCss().expect.element('.tooltip').to.be.present;
      });
    });
  },

  // 'Finding layer by ID with search': (client) => {
  //   client.click(addLayers);
  //   client.waitForElementVisible(layersSearchField, TIME_LIMIT, (e) => {
  //     client.setValue(layersSearchField, MERRA_2_LAYER_ID);
  //     client.waitForElementVisible(layersSearchRow, TIME_LIMIT, (e) => {
  //       client
  //         .useCss()
  //         .assert.containsText(layersAll, LAYER_TITLE);
  //       client
  //         .useCss()
  //         .assert.containsText(layersAll, 'MERRA-2');
  //     });
  //   });
  // },
  // 'Verify details show about selected layer are visible when selected': (client) => {
  //   client.waitForElementVisible(layerDetails, TIME_LIMIT, (e) => {
  //     client
  //       .useCss()
  //       .expect.element(layerDetailHeader)
  //       .text.contains(LAYER_TITLE);
  //     client
  //       .useCss()
  //       .expect.element(layerDetailsDateRange).to.be.present;
  //   });
  // },
  // 'Verify "Add layer" button toggles checkbox': (client) => {
  //   client.waitForElementVisible(layerDetails, TIME_LIMIT, (e) => {
  //     client.click(addToMapButton).pause(250);
  //     client
  //       .useCss()
  //       .expect.element(layerCheckBoxEnabled).to.be.present;
  //   });
  // },
  // 'Click back button to return to main selection': (client) => {
  //   client.waitForElementVisible(layerPickerBackButton, TIME_LIMIT, (e) => {
  //     client.click(layerPickerBackButton);
  //     client.waitForElementVisible(aerosolOpticalDepth, TIME_LIMIT);
  //   });
  // },
  // 'Close Layer modal': (client) => {
  //   client.click(layersModalCloseButton).pause(2000);
  //   client.useCss().expect.element(layersAll).to.not.be.present;
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
