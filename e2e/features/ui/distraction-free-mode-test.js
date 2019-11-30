const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');
const TIME_LIMIT = 5000;

module.exports = {
  before: client => {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },

  // verify distraction free mode shortcut hides ui elements
  'Enabling distraction free mode with shortcut key hides UI elements': client => {
    client.pause(300);
    client.sendKeys('body', [client.Keys.SHIFT, 'd', client.Keys.NULL]);
    client.pause(300);
    client.waitForElementPresent('#wv-distraction-free-mode-button', TIME_LIMIT);

    client.waitForElementNotVisible('.timeline-container', TIME_LIMIT);
    client.waitForElementNotVisible(localSelectors.sidebarContainer, TIME_LIMIT);
    client.waitForElementNotPresent('#wv-link-button', TIME_LIMIT);
    client.waitForElementNotPresent('#wv-proj-button', TIME_LIMIT);
    client.waitForElementNotPresent('#wv-image-button', TIME_LIMIT);
    client.waitForElementNotPresent('#wv-info-button', TIME_LIMIT);
    client.waitForElementNotVisible(localSelectors.measureBtn, TIME_LIMIT);
    client.waitForElementNotVisible('.wv-map-zoom-in', TIME_LIMIT);
    client.waitForElementNotVisible('.wv-map-zoom-out', TIME_LIMIT);
    client.waitForElementNotVisible('.wv-map-scale-metric', TIME_LIMIT);
    client.waitForElementNotVisible('.wv-map-scale-imperial', TIME_LIMIT);
  },

  // verify turning off distraction free mode shortcut returns hidden ui elements
  'Disabling distraction free mode with shortcut key returns UI elements': client => {
    client.pause(300);
    client.sendKeys('body', [client.Keys.SHIFT, 'd', client.Keys.NULL]);
    client.pause(300);
    client.waitForElementNotPresent('#wv-distraction-free-mode-button', TIME_LIMIT);

    client.waitForElementVisible('.timeline-container', TIME_LIMIT);
    client.waitForElementVisible(localSelectors.sidebarContainer, TIME_LIMIT);
    client.waitForElementVisible('#wv-link-button', TIME_LIMIT);
    client.waitForElementPresent('#wv-proj-button', TIME_LIMIT);
    client.waitForElementPresent('#wv-image-button', TIME_LIMIT);
    client.waitForElementPresent('#wv-info-button', TIME_LIMIT);
    client.waitForElementVisible(localSelectors.measureBtn, TIME_LIMIT);
    client.waitForElementPresent('.wv-map-zoom-in', TIME_LIMIT);
    client.waitForElementPresent('.wv-map-zoom-out', TIME_LIMIT);
    client.waitForElementPresent('.wv-map-scale-metric', TIME_LIMIT);
    client.waitForElementPresent('.wv-map-scale-imperial', TIME_LIMIT);
  },

  after: client => {
    client.end();
  }
};
