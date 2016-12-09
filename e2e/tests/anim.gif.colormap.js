module.exports = {
    'Animation GIF when custom colormap is activated' : function (browser) {
        browser
            .url(browser.globals.url + '?p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,AIRS_CO_Total_Column_Day(palette=red_1),Reference_Labels(hidden),Reference_Features(hidden),Coastlines&t=2016-04-08&z=3&v=-223.875,-91.828125,162.84375,98.296875&ab=on&as=2016-03-25&ae=2016-04-08&av=3&al=false')
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
                browser.waitForElementVisible('.wv-dialog-ask',  1000, function(el) {
                    // Verify dialogue asking to revert colormap appears
                    browser.expect.element('.ui-dialog-buttonset button:nth-child(2)').to.be.present;
                    // Close GIF results
                    browser.click('.ui-dialog-buttonset button:nth-child(2)');
                    browser.waitForElementVisible('.gif-results-dialog-case',  10000, function(el) {
                        browser.expect.element('.gif-results-dialog').to.be.present;
                        browser.expect.element('.gif-results-dialog-case img').to.be.present;
                    });
                });

            });
        });
        browser.end();
    }
};