// const { loadAndSkipTour } = require('../../reuseables/skip-tour');
// const {
//   openImageDownloadPanel,
// } = require('../../reuseables/image-download');

// const TIME_LIMIT = 5000;
// const input = {
//   maxLat: '#latlong-input-3',
//   maxLon: '#latlong-input-2',
//   minLat: '#latlong-input-1',
//   minLon: '#latlong-input-0',
// };

// const changeInput = (c, selector, newValue) => {
//   [...'123456'].forEach(() => {
//     c.sendKeys(selector, c.Keys.ARROW_RIGHT);
//   });
//   [...'123456789'].forEach(() => {
//     c.sendKeys(selector, c.Keys.BACK_SPACE);
//   });
//   c.sendKeys(selector, newValue);
//   c.sendKeys(selector, c.Keys.ENTER);
// };

// module.exports = {
//   before(client) {
//     loadAndSkipTour(client, TIME_LIMIT);
//   },

//   after(client) {
//     client.end();
//   },

//   'Check that image download inputs are hidden on initial load': function(c) {
//     openImageDownloadPanel(c);
//     c.expect.element('.wv-image-input-title span').text.to.equal('Edit Coordinates');
//     c.expect.element('.wv-image-input-subtitle').to.not.be.present;
//   },
//   'Check that image download extent inputs open on click': function(c) {
//     c.click('.wv-image-input-title span');
//     c.waitForElementVisible('.wv-image-input-subtitle', TIME_LIMIT);
//   },
//   'Verify that input updates crop boundary labels ': function(c) {
//     c.waitForElementVisible(input.maxLat, TIME_LIMIT);

//     changeInput(c, input.maxLat, '-14');
//     changeInput(c, input.maxLon, '14');
//     changeInput(c, input.minLat, '-40');
//     changeInput(c, input.minLon, '-20');

//     c.waitForElementVisible('#wv-image-top', TIME_LIMIT);
//     c.assert.containsText('#wv-image-top', '-14.0000');
//     c.assert.containsText('#wv-image-top', '14.0000');
//     c.assert.containsText('#wv-image-bottom', '-40.0000');
//     c.assert.containsText('#wv-image-bottom', '-20.0000');
//   },
// };
