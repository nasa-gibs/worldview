const TIME_LIMIT = 30000;
const mockParam = '?mockAlerts=';
// Selectors
const infoButton = '#wv-info-button';
const infoButtonIcon = '#wv-info-button svg.svg-inline--fa';
const infoMenu = '#toolbar_info';
const giftListItem = '#toolbar_info li.gift';
const boltListItem = '#toolbar_info li.bolt';
const exclamationListItem = '#notifications_info_item .fa-exclamation-circle';
const alertContentHightlighted =
  '#notification_list_modal .alert-notification-item';
const outageContentHightlighted =
  '#notification_list_modal .outage-notification-item';
const messageContentHightlighted =
  '#notification_list_modal .message-notification-item';

module.exports = {
  'No visible notifications with mockAlert parameter set to no_types': function(
    client
  ) {
    client.url(`${client.globals.url + mockParam}no_types`);
    client.waitForElementVisible(infoButtonIcon, TIME_LIMIT, () => {
      client.useCss().click(infoButtonIcon);
      client.pause(2000);
      client
        .useCss()
        .expect.element(infoMenu)
        .text.not.contains('Notifications');
      client.expect.element(giftListItem).to.not.be.present;
      client.expect.element(boltListItem).to.not.be.present;
    });
  },
  'Outage takes precedence when all three notifications are present': function(
    client
  ) {
    client.url(`${client.globals.url + mockParam}all_types`);
    client.waitForElementVisible(infoButtonIcon, TIME_LIMIT, () => {
      client.expect.element(`${infoButton}.wv-status-outage`).to.be.present;
      client.useCss().click(infoButtonIcon);
      client.pause(2000);
      client.useCss().assert.containsText(infoMenu, 'Notifications');
      client.expect.element(exclamationListItem).to.be.present;
    });
  },
  'alert, outage, and message content is highlighted and found in modal': function(
    client
  ) {
    client.useCss().click(exclamationListItem);
    client.waitForElementVisible(outageContentHightlighted, TIME_LIMIT, () => {
      client
        .useCss()
        .assert.containsText(
          `${outageContentHightlighted} span`,
          'Posted 20 May 2018'
        );
      client
        .useCss()
        .assert.containsText(
          `${alertContentHightlighted} p`,
          'learn how to visualize global satellite imagery'
        );
      client
        .useCss()
        .assert.containsText(
          `${messageContentHightlighted} p`,
          'This is a message test'
        );
    });
  },
  'Verify that the user is only alerted if he has not already stored all items in localStorage': function(
    client
  ) {
    client
      .useCss()
      .click('#notification_list_modal .close')
      .pause(500);
    client.waitForElementVisible(infoButtonIcon, TIME_LIMIT, () => {
      client.expect.element(`${infoButton}.wv-status-hide`).to.be.present;
    });
  },
  after(client) {
    client.end();
  }
};
