module.exports = {
    'Layer Descriptions - Layer search ("Add Layers" Search: "Corrected Reflectance (True Color)"' : function (browser) {
        browser
            .url(browser.globals.url)
            .pause(1000);
        browser.waitForElementVisible('#skipTour', 10000, function (el) {
            browser.click('#skipTour');

            /*
             * Check to see if 'Add Layers' Butto is present and click
             */
            browser.expect.element('#layers-add').to.be.present;
            browser.click('#layers-add').pause(1000);
            // Corrected Reflectance (True Color) should have descrition
            browser.setValue('#layers-search-input', 'Corrected Reflectance (True Color)').pause(5000);
            browser.expect.element('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor').to.be.present;
            browser.click('#layer-flat-VIIRS_SNPP_CorrectedReflectance_TrueColor .fa-info-circle').pause(1000);

        });
        browser.end();
    }
};
