module.exports = {
    'Layer Descriptions - Layer search ("Add Layers" Search: "Corrected Reflectance (True Color)"' : function (browser) {
        browser
            .url(browser.globals.url)
            .pause(1000);
        browser.waitForElementVisible('#skipTour', 10000, function (el) {
            browser.click('#skipTour');

            // Check the 'Add Layers' search layer for a description

        });
        browser.end();
    }
};
