module.exports = {
  'Animation tests': function(browser) {
    browser
      .url(browser.globals.url)
      .pause(1000);
    browser.waitForElementVisible('#skipTour', 1000, function(el) {
      browser.click('#skipTour');
      /*
       * check to see if animation widget is visible
       * after Icon is clicked
       */
      browser.expect.element('.wv-animation-widget-header').to.not.be.visible;
      browser.click('#animate-button');
      browser.pause(1000);
      browser.expect.element('.wv-animation-widget-header').to.be.visible;
      /*
       * Verify that date selectors adjust when
       * animation draggers are dragged
       */
      browser.getValue('.wv-anim-dates-case .wv-date-selector-widget:first-child #day-input-group', function(result) {
        startDay = result.value;
        browser
          .useCss()
          .moveToElement('#wv-timeline-range-selector:first-child polygon', 1, 1)
          .mouseButtonDown(0)
          .moveTo(null, -40, 0)
          .mouseButtonUp(0)
          .pause(100);
        browser.getValue('.wv-anim-dates-case .wv-date-selector-widget:first-child #day-input-group', function(result) {
          newDay = result.value;
          // startDay != newDay
          this.assert.notEqual(startDay, newDay);
        });
      });

      /*
       * Verify that timeline zoom changes on tooltip click
       */
      browser
        .useCss()
        .moveToElement('.wv-tooltip-case:first-child', 1, 1)
        .click('.wv-tooltip #yearly')
        .pause(1000);
      // Check if correct timeline zoom is selected
      browser.expect.element('#zoom-years.depth-1').to.be.present;
    });
    browser.end();
  }
};
