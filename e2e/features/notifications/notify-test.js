const TIME_LIMIT = 30000;
const mockParam = '?mockAlerts=';
// Selectors
const infoButton = '#wv-info-button';
const infoButtonLabel = '#wv-info-button label';
const infoMenu = '#wv-info-menu';
const giftListItem = '#wv-info-menu li.gift';
const boltListItem = '#wv-info-menu li.bolt';
const exclamationListItem = '#wv-info-menu li.exclamation-circle';
const alertContentHightlighted = '.wv-notify-modal .alert';
const outageContentHightlighted = '.wv-notify-modal .outage';
const notifyModal = '.wv-notify-modal';

module.exports = {
  'No visible notifications with mockAlert parameter set to no_types': function(client) {
    client.url(client.globals.url + mockParam + 'no_types');
    client.waitForElementVisible(infoButtonLabel, TIME_LIMIT, () => {
      client.useCss().click(infoButtonLabel);
      client.pause(2000);
      client.useCss().expect.element(infoMenu).text.not.contains('Notifications');
      client.expect.element(giftListItem).to.not.be.present;
      client.expect.element(boltListItem).to.not.be.present;
    });
  },
  'Outage takes precedence when both alerts and outages are present': function(client) {
    client.url(client.globals.url + mockParam + 'all_types');
    client.waitForElementVisible(infoButtonLabel, TIME_LIMIT, () => {
      client.expect.element(infoButton + '.wv-status-outage').to.be.present;
      client.useCss().click(infoButtonLabel);
      client.pause(2000);
      client.useCss().assert.containsText(infoMenu, 'Notifications');
      client.expect.element(exclamationListItem).to.be.present;
    });
  },
  'Both alert and outage content is highlighted and found in modal': function(client) {
    client.useCss().click(exclamationListItem + ' a');
    client.waitForElementVisible(outageContentHightlighted, TIME_LIMIT, () => {
      client.useCss().assert.containsText(outageContentHightlighted + ' span', 'Posted 20 May 2018');
      client.useCss().assert.containsText(alertContentHightlighted, 'Posted 20 February 2018');
    });
  },
  'Message is in info menu with mockAlert parameter set to message': function(client) {
    client.url(client.globals.url + mockParam + 'message');
    client.waitForElementVisible(infoButtonLabel, TIME_LIMIT, () => {
      client.useCss().click(infoButtonLabel);
      client.pause(2000);
      client.useCss().expect.element(infoMenu).text.not.contains('Notifications');
      client.expect.element(giftListItem).to.be.present;
    });
  },
  'Message modal contains message content': function(client) {
    client.useCss().click(giftListItem + ' a');
    client.waitForElementVisible(notifyModal, TIME_LIMIT, () => {
      client.expect.element(alertContentHightlighted).to.not.be.present;
      client.useCss().assert.containsText(notifyModal + ' span', 'Posted 20 March 2018');
      client.useCss().assert.containsText(notifyModal + ' p', 'This is a message test');
    });
  },
  'Verify that the user is only alerted if he has not already stored all items in localStorage': function(client) {
    client.url(client.globals.url + mockParam + 'all_types');
    client.waitForElementVisible(infoButtonLabel, TIME_LIMIT, () => {
      client.expect.element(infoButton + '.wv-status-hide').to.be.present;
    });
  },
  after: function(client) {
    client.end();
  }
};
