const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const TIME_LIMIT = 10000;

const {
  shareToolbar,
  shareToolbarButton,
  shareLinkInput,
} = localSelectors;

module.exports = {
  before(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Clicking the share link button opens the share dialog': (client) => {
    client.waitForElementVisible(shareToolbarButton, TIME_LIMIT);
    client.click(shareToolbarButton);
    client.waitForElementVisible(shareToolbar, TIME_LIMIT);
    client.expect.element(shareToolbar).to.be.present;
  },
  'Share link clipboard with existing time query string param in the page url will have the same serialized time': (client) => {
    const queryString = '?t=2018-12-31';
    client.url(client.globals.url + queryString);
    client.waitForElementVisible(shareToolbarButton, TIME_LIMIT);
    client.click(shareToolbarButton);
    client.assert.urlContains('t=');
    client.assert.attributeContains(shareLinkInput, 'value', `${client.globals.url}?t=2018-12-31-T00%3A00%3A00Z`);
  },
  'Share link clipboard with no time query string param in the page url will have the same serialized time (partial YYYY-MM-DD)': (client) => {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
    client.waitForElementVisible(shareToolbarButton, TIME_LIMIT);
    client.click(shareToolbarButton);
    let date = new Date();
    if (date.getUTCHours() < 3) {
      date = new Date(date.getTime() - 86400000);
    }
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const monthText = month < 10 ? `0${month}` : month;
    const dayText = day < 10 ? `0${day}` : day;
    client.assert.not.urlContains('t=');
    client.assert.attributeContains(shareLinkInput, 'value', `t=${year}-${monthText}-${dayText}`);
  },
  after(client) {
    client.end();
  },
};
