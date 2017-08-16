module.exports = {
  'Running Data: Category layer': function(browser) {
    var height, width;
    browser
      .url(browser.globals.url + '?p=geographic&l=ndh-cyclone-hazard-frequency-distribution&t=2017-03-22&z=3&v=82.46635734982672,-6.4831088350501,179.52632254986727,41.18539478390474')
      .pause(500);

    browser.getElementSize("#wv-map-geographic .ol-viewport", function(result) {

      width = result.value.width;
      height = result.value.height;

      browser
        .useCss()
        .moveToElement('.ol-viewport', width - (width / 2), height - (height / 2)) // clicking the very middle point of page
        .pause(10);
      browser.getText('.wv-running-category-label', function(result) {
        this.assert.equal(result.value, '31 - 65');
      });
      browser
        .useCss()
        .moveToElement('.wv-palettes-legend:first-child', 3, 3)
        .mouseButtonDown(0)
        .pause(10);

      browser.getText('.wv-running-category-label', function(result) {
        this.assert.equal(result.value, '1 - 5');
      });
    });
    browser.end();
  }
};
