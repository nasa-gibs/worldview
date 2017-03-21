module.exports = {
    'Animation GIF tests' : function (browser) {
        var startDay, newDay;
        browser
            .url(browser.globals.url + '?p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels(hidden),Reference_Features(hidden),Coastlines&t=2016-11-28&z=1&v=-209.109375,-63.421875,148.078125,69.890625&ab=on&as=2013-11-21&ae=2016-11-28&av=3&al=false')
            .pause(1000);
        /*
         * Should not show Tour
         */
        browser.expect.element('#skipTour').to.not.be.present;

        /*
         * check to see if animation widget 
         * is active after page load
         */
        browser.waitForElementVisible('#wv-animation-widget', 1000, function(el) {
            // Click on GIF icon
            browser.click('.fa-file-video-o.wv-animation-widget-icon');
            // Wait for GIF selection to appear
            browser.waitForElementVisible('.fa-download', 1000, function(el) {
                // Initiate download
                browser.click('.fa-download');
                // wait for GIF to be created
                browser.waitForElementVisible('.gif-results-dialog-case',  10000, function(el) {
                    // Verify that GIF was created
                    browser.expect.element('.gif-results-dialog').to.be.present;
                    browser.expect.element('.gif-results-dialog-case img').to.be.present;
                    browser.pause(1000);
                    // Close GIF results
                    browser.expect.element('.wv-gif-results button.ui-dialog-titlebar-close').to.be.visible;
                    browser.click('.wv-gif-results button.ui-dialog-titlebar-close');
                    // Verify that animation widget is visible again
                    browser.waitForElementVisible('#wv-animation-widget',  3000, function(el) {
                        browser.pause(1000);
                    });
                });

            });
        });

        /*
         * Verify that timeline zoom is changed
         */
        

        browser.end();
    }
};