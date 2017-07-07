module.exports = {
    'Layer Descriptions - Sidebar' : function (browser) {
        browser
            .url(browser.globals.url)
            .pause(1000);
        browser.waitForElementVisible('#skipTour', 10000, function (el) {
            browser.click('#skipTour');
            /*
             * check to see if info dialog widget is present
             * after info icon is clicked
             */
            browser.expect.element('#overlays li:first-child .wv-layers-info').to.be.present;

            browser.click('#overlays li:first-child .wv-layers-info').pause(1000);
            browser.expect.element('.ui-widget-content #wv-layers-info-dialog').to.be.present;

            browser.click('#overlays li:first-child .wv-layers-info').pause(1000);
            browser.expect.element('.ui-widget-content #wv-layers-info-dialog').to.not.be.present;

            browser.click('#overlays li:first-child .wv-layers-info').pause(1000);
            browser.expect.element('.ui-widget-content #wv-layers-info-dialog').to.be.present;

            /*
             * check to see if info dialog widget is closed
             * after options icon is clicked
             *
             * check ton see if options dialog widget is present
             * after options icon is clicked
             */
            browser.click('#overlays li:first-child .wv-layers-options').pause(1000);
            browser.expect.element('.ui-widget-content #wv-layers-info-dialog').to.not.be.present;
            browser.expect.element('.ui-widget-content #wv-layers-options-dialog').to.be.present;

        });
        browser.end();
    }
};
