const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const TIME_LIMIT = 10000;

const {
  socialToolbar,
  socialCopyLinkButton,
  socialLinkInput,
} = localSelectors;

module.exports = {
  before(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Clicking the social link button opens the social share dialog': (client) => {
    client.waitForElementVisible(socialCopyLinkButton, TIME_LIMIT);
    client.click(socialCopyLinkButton);
    client.waitForElementVisible(socialToolbar, TIME_LIMIT);
    client.expect.element(socialToolbar).to.be.present;
  },
  'Share link clipboard with existing time query string param in the page url will have the same serialized time': (client) => {
    const queryString = '?t=2018-12-31';
    client.url(client.globals.url + queryString);
    client.waitForElementVisible(socialCopyLinkButton, TIME_LIMIT);
    client.click(socialCopyLinkButton);
    client.assert.urlContains('t=');
    client.assert.attributeContains(socialLinkInput, 'value', `${client.globals.url}?t=2018-12-31-T00%3A00%3A00Z`);
  },
  'Share link clipboard with no time query string param in the page url will have the same serialized time (partial YYYY-MM-DD)': (client) => {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
    client.waitForElementVisible(socialCopyLinkButton, TIME_LIMIT);
    client.click(socialCopyLinkButton);
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    client.assert.not.urlContains('t=');
    client.assert.attributeContains(socialLinkInput, 'value', `t=${year}-${month < 10 ? `0${month}` : month}-${day}`);
  },
  after(client) {
    client.end();
  },
};
