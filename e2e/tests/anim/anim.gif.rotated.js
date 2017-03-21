module.exports = {
    'Animation GIF when rotated' : function (browser) {
        browser
            .url(browser.globals.url +'?p=arctic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels(hidden),Reference_Features(hidden),Coastlines&t=2016-12-09&z=3&v=-11581865.476734415,-9127562.458195869,8128168.69159992,13797545.894980166&r=-54.0000&ab=on&as=2016-12-02&ae=2016-12-09&av=3&al=true')
            .pause(1000);

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
                    // Verify dialogue asking to revert rotation appears
                    browser.expect.element('.ui-dialog-buttonset button:nth-child(2)').to.be.present;
                    // Close GIF results
                    browser.click('.ui-dialog-buttonset button:nth-child(2)');
                    browser.waitForElementVisible('.fa-download', 1000, function(el) {
                    	// Varify that a reselection is possible
                        browser.expect.element('.fa-download').to.be.present;
                    });
                });
            });
        });
        browser.end();
    }
};