module.exports = {
    'Animation tests' : function (browser) {
        var previousDay, newDay;
        browser
            .url('https://worldview.sit.earthdata.nasa.gov/')
            .pause(1000);
        browser.waitForElementVisible('#skipTour', 1000, function (el) {
            browser.click('#skipTour');
            /*
             * check to see up animation is shown
             * on Click
             */
            browser.expect.element('.wv-animation-widget-header').to.not.be.visible;
            console.log('animate icon clicked');
            browser.click('#animate-button');
            browser.pause(1000);
            browser.expect.element('.wv-animation-widget-header').to.be.visible;
            /*
             * check to see up animation is shown
             * on Click
             */
            browser.expect.element('#wv-timeline-range-selector:first-child polygon').to.be.visible;
            console.log('moving dragger');
            browser.pause(1000);
            // previousDay = browser.getValue('.wv-anim-dates-case:first-child #day-input-group', function(res) {
            //     console.log(res)
            //     return res.value;
            // });
            browser
                .useCss()
                .moveToElement('#wv-timeline-range-selector:first-child polygon',  1,  1)
                .mouseButtonDown(0)
                .moveTo(null,  -40,  0)
                .mouseButtonUp(0);
            // newDay = browser.getValue('.wv-anim-dates-case:first-child #day-input-group', function(res) {
            //     return res.value;
            // });
            //this.assert.ok(newDay != previousDay, 'make sure day string changed');
            browser.pause(5000)
        });
        browser.end();
    }
};