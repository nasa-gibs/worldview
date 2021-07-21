const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const TIME_LIMIT = 10000;

const {
  shareToolbar,
  shareToolbarButton,
  shareLinkInput,
} = localSelectors;

const linkShareNav = '.link-share-nav';
const embedShareNav = '.embed-share-nav';
const socialShareNav = '.social-share-nav';

module.exports = {
  before(c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
  },
  'Clicking the share link button opens the share dialog': (c) => {
    c.waitForElementVisible(shareToolbarButton, TIME_LIMIT);
    c.click(shareToolbarButton);
    c.waitForElementVisible(shareToolbar, TIME_LIMIT);
    c.expect.element(shareToolbar).to.be.present;
  },
  'Share tabs link, embed, and social are visible and enabled': (c) => {
    c.expect.element(linkShareNav).to.be.present;
    c.expect.element(embedShareNav).to.be.present;
    c.expect.element(socialShareNav).to.be.present;
    c.assert.cssClassPresent(`${linkShareNav} a`, 'active');
  },
  'Share link clipboard with existing time query string param in the page url will have the same serialized time': (c) => {
    const queryString = '?t=2018-12-31';
    c.url(c.globals.url + queryString);
    c.waitForElementVisible(shareToolbarButton, TIME_LIMIT);
    c.click(shareToolbarButton);
    c.assert.urlContains('t=');
    c.assert.attributeContains(shareLinkInput, 'value', `${c.globals.url}?t=2018-12-31-T00%3A00%3A00Z`);
  },
  'Share link clipboard with no time query string param in the page url will have the same serialized time (partial YYYY-MM-DD)': (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
    c.waitForElementVisible(shareToolbarButton, TIME_LIMIT);
    c.click(shareToolbarButton);
    let date = new Date();
    if (date.getUTCHours() < 3) {
      date = new Date(date.getTime() - 86400000);
    }
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const monthText = month < 10 ? `0${month}` : month;
    const dayText = day < 10 ? `0${day}` : day;
    c.assert.not.urlContains('t=');
    c.assert.attributeContains(shareLinkInput, 'value', `t=${year}-${monthText}-${dayText}`);
  },
  'Clicking the social tab displays social share buttons': (c) => {
    c.click(shareToolbarButton);
    c.waitForElementVisible(shareToolbar, TIME_LIMIT);
    c.click(`${socialShareNav} a`);
    c.waitForElementVisible('#social-share', TIME_LIMIT);
    c.expect.element('#fb-share').to.be.present;
    c.expect.element('#tw-share').to.be.present;
    c.expect.element('#rd-share').to.be.present;
    c.expect.element('#email-share').to.be.present;
  },
  after(c) {
    c.end();
  },
};
