const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const {
  geosearchMinimizeButton,
  geosearchToolbarButton,
  sidebarContainer,
  measureBtn,
} = localSelectors;

const TIME_LIMIT = 5000;

module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
    // ensure geosearch is minimized
    c.click(geosearchMinimizeButton);
  },

  // verify distraction free mode shortcut hides ui elements
  'Enabling distraction free mode with shortcut key hides UI elements': (c) => {
    c.pause(300);
    c.sendKeys('body', [c.Keys.SHIFT, 'd', c.Keys.NULL]);
    c.pause(300);

    c.waitForElementNotVisible('.timeline-container', TIME_LIMIT);
    c.waitForElementNotVisible(sidebarContainer, TIME_LIMIT);
    c.waitForElementNotVisible(geosearchToolbarButton, TIME_LIMIT);
    c.waitForElementNotPresent('#wv-link-button', TIME_LIMIT);
    c.waitForElementNotPresent('#wv-proj-button', TIME_LIMIT);
    c.waitForElementNotPresent('#wv-image-button', TIME_LIMIT);
    c.waitForElementNotVisible(measureBtn, TIME_LIMIT);
    c.waitForElementNotVisible('.wv-map-zoom-in', TIME_LIMIT);
    c.waitForElementNotVisible('.wv-map-zoom-out', TIME_LIMIT);
    c.waitForElementNotVisible('.wv-map-scale-metric', TIME_LIMIT);
    c.waitForElementNotVisible('.wv-map-scale-imperial', TIME_LIMIT);
  },

  // verify turning off distraction free mode shortcut returns hidden ui elements
  'Disabling distraction free mode with shortcut key returns UI elements': (c) => {
    c.pause(300);
    c.sendKeys('body', [c.Keys.SHIFT, 'd', c.Keys.NULL]);
    c.pause(300);

    c.waitForElementVisible('.timeline-container', TIME_LIMIT);
    c.waitForElementVisible(sidebarContainer, TIME_LIMIT);
    c.waitForElementVisible(geosearchToolbarButton, TIME_LIMIT);
    c.waitForElementVisible('#wv-link-button', TIME_LIMIT);
    c.waitForElementPresent('#wv-proj-button', TIME_LIMIT);
    c.waitForElementPresent('#wv-image-button', TIME_LIMIT);
    c.waitForElementVisible(measureBtn, TIME_LIMIT);
    c.waitForElementPresent('.wv-map-zoom-in', TIME_LIMIT);
    c.waitForElementPresent('.wv-map-zoom-out', TIME_LIMIT);
    c.waitForElementPresent('.wv-map-scale-metric', TIME_LIMIT);
    c.waitForElementPresent('.wv-map-scale-imperial', TIME_LIMIT);
  },

  after: (c) => {
    c.end();
  },
};
