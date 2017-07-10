module.exports = {
  'Layer Descriptions - Measurment source ("Add Layers" Categories / All / Aerosol Optical Depth / Terra/MODIS)' : function (browser) {
    browser.url(browser.globals.url).pause(1000);
    browser.waitForElementVisible('#skipTour', 10000, function (el) {
      browser.click('#skipTour');

      // Check the 'Add Layers' Categories / All / Aerosol Optical Depth / Terra/MODIS
      // for the presence of a description box.

    });
    browser.end();
  }
};
