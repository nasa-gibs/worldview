module.exports = {
    'Layer Descriptions - Layer search ("Add Layers" Search: "Corrected Reflectance (True Color)"' : function (browser) {
        browser
            .url(browser.globals.url)
            .pause(1000);
        browser.waitForElementVisible('#skipTour', 10000, function (el) {
            browser.click('#skipTour');

            /*
             * Check to see if 'Add Layers' Butto is present and click to open it
             */
            browser.expect.element('#layers-add').to.be.present;
            browser.click('#layers-add').pause(1000);

            // Search for Corrected Reflectance (True Color) as this should have a descrition.
            browser.setValue('#layers-search-input', 'Corrected Reflectance (True Color)').pause(3000);
            browser.expect.element('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor').to.be.present;

            // Click the description icon and check if css hidden class has been removed (to expose description).
            browser.click('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor .fa-info-circle').pause(1000);
            browser.assert.cssClassNotPresent('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor .source-metadata', 'hidden');

            // Click the description icon and check if css hidden class has been added (to hide description).
            browser.click('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor .fa-info-circle').pause(1000);
            browser.assert.cssClassPresent('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor .source-metadata', 'hidden');

            // Click the description icon, check if no hidden class is present and element is visible.
            browser.click('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor .fa-info-circle').pause(1000);
            browser.assert.cssClassNotPresent('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor .source-metadata', 'hidden');
            browser.expect.element('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor .source-metadata').to.be.visible;

            // Scroll to close arrow at bottom of description, click close arrow, check hidden class, check if element is not visible.
            browser.moveToElement('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor .source-metadata .metadata-more', 10, 10).pause(1000);
            browser.click('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor .source-metadata .metadata-more').pause(1000);
            browser.assert.cssClassPresent('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor .source-metadata', 'hidden');
            browser.expect.element('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor .source-metadata').to.not.be.visible;

        });
        browser.end();
    }
};
