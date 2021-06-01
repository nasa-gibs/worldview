const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const TIME_LIMIT = 10000;

const {
  addLayers,
  compareButton,
  dataDownloadTabButton,
  embedLinkButton,
  eventsSidebarTabButton,
  infoToolbarButton,
  locationSearchToolbarButton,
  measureBtn,
  projToolbarButton,
  shareEmbedInput,
  shareToolbar,
  shareToolbarButton,
  snapshotToolbarButton,
} = localSelectors;

const embedShareNav = '.embed-share-nav';

// embed input value with default page 2020-01-01
const iframeValue = (c) => `<iframe src="${c.globals.url}?t=2020-01-01-T00%3A00%3A00Z&em=true" role="application" sandbox="allow-modals allow-scripts allow-same-origin allow-forms allow-popups" width="100%" height="100%" allow="fullscreen; autoplay;" loading="lazy"></iframe>`;

module.exports = {
  before(c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
  },
  'Embed share tab dialog displays embed input': (c) => {
    const queryString = '?t=2020-01-01';
    c.url(c.globals.url + queryString);
    c.waitForElementVisible(shareToolbarButton, TIME_LIMIT);
    c.click(shareToolbarButton);
    c.waitForElementVisible(shareToolbar, TIME_LIMIT);
    c.click(`${embedShareNav} a`);
    c.waitForElementVisible(shareEmbedInput, TIME_LIMIT);
    c.assert.attributeContains(shareEmbedInput, 'value', iframeValue(c));
  },
  'Embed share nav link tab disabled if data tab selected': (c) => {
    const queryString = '?sh=VIIRS_NOAA20_CorrectedReflectance_TrueColor,C1604567932-LANCEMODIS&t=2020-01-01';
    c.url(c.globals.url + queryString);
    c.waitForElementVisible(shareToolbarButton, TIME_LIMIT);
    c.click(shareToolbarButton);
    c.waitForElementVisible(shareToolbar, TIME_LIMIT);
  },
  'Embed share nav link tab disabled if tour active': (c) => {
    const queryString = '?tr=swath_gaps';
    c.url(c.globals.url + queryString);
    c.waitForElementVisible(shareToolbarButton, TIME_LIMIT);
    c.click(shareToolbarButton);
    c.waitForElementVisible(shareToolbar, TIME_LIMIT);
    c.assert.cssClassPresent(`${embedShareNav} a`, 'disabled');
  },
  'Embed mode is active with query string parameter': (c) => {
    const queryString = '?t=2020-01-01&em=true';
    c.url(c.globals.url + queryString);
    c.waitForElementVisible('.embed-overlay-bg', TIME_LIMIT);
    c.waitForElementVisible('.embed-overlay-btn', TIME_LIMIT);
    c.click('.embed-overlay-bg');
    c.expect.element(embedLinkButton).to.be.visible;
  },
  'Embed mode styling is correct': (c) => {
    // visible
    c.expect.element('.timeline-header-mobile').to.be.visible;
    c.expect.element('.mobile-date-change-arrows-btn').to.be.visible;
    // not present
    c.expect.element(eventsSidebarTabButton).to.not.be.present;
    c.expect.element(locationSearchToolbarButton).to.not.be.present;
    // not visible
    c.expect.element(dataDownloadTabButton).to.not.be.visible;
    c.expect.element(infoToolbarButton).to.not.be.visible;
    c.expect.element(measureBtn).to.not.be.visible;
    c.expect.element(projToolbarButton).to.not.be.visible;
    c.expect.element(shareToolbarButton).to.not.be.visible;
    c.expect.element(snapshotToolbarButton).to.not.be.visible;
    c.expect.element(addLayers).to.not.be.visible;
    c.expect.element(compareButton).to.not.be.visible;
  },
  'Clicking embed link button opens up new tab': (c) => {
    c.click(embedLinkButton);
    c.pause(1000);
    c.windowHandles((tabs) => {
      c.assert.equal(tabs.value.length, 2);
    });
  },
  after(c) {
    c.end();
  },
};
