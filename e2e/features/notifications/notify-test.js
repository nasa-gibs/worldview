const TIME_LIMIT = 30000;
const mockParam = '?mockAlerts=';
const layerNoticesTestParams = '?l=Coastlines,MODIS_Aqua_CorrectedReflectance_TrueColor,MODIS_Terra_CorrectedReflectance_TrueColor';
const { addLayers, categoriesNav } = require('../../reuseables/selectors.js');

// Selectors
const infoButton = '#wv-info-button';
const infoButtonIcon = '#wv-info-button svg.svg-inline--fa';
const infoMenu = '#toolbar_info';
const giftListItem = '#toolbar_info li.gift';
const boltListItem = '#toolbar_info li.bolt';
const notificationsListItem = '#notifications_info_item .fa-exclamation-circle';
const alertContentHightlighted = '#notification_list_modal .alert-notification-item';
const outageContentHightlighted = '#notification_list_modal .outage-notification-item';
const messageContentHightlighted = '#notification_list_modal .message-notification-item';
const aquaNotice = 'The Aqua / MODIS Corrected Reflectance (True Color) layer is currently unavailable.';
const aquaTerraNotice = 'Several Aqua and Terra MODIS layers are experiencing delays in processing.';
const tooltipSelector = '.tooltip-inner div';
const aquaZot = '#MODIS_Aqua_CorrectedReflectance_TrueColor-zot';
const terraZot = '#MODIS_Terra_CorrectedReflectance_TrueColor-zot';

module.exports = {
  'No visible notifications with mockAlert parameter set to no_types': function(c) {
    c.url(`${c.globals.url + mockParam}no_types`);
    c.waitForElementVisible(infoButtonIcon, TIME_LIMIT);
    c.click(infoButtonIcon);
    c.pause(2000);
    c.expect.element(infoMenu).text.not.contains('Notifications');
    c.expect.element(giftListItem).to.not.be.present;
    c.expect.element(boltListItem).to.not.be.present;
  },
  'Outage takes precedence when all three notifications are present': function(c) {
    c.url(`${c.globals.url + layerNoticesTestParams}&mockAlerts=all_types`);
    c.waitForElementVisible(infoButtonIcon, TIME_LIMIT);
    c.expect.element(`${infoButton}.wv-status-outage`).to.be.present;
    c.click(infoButtonIcon);
    c.pause(2000);
    c.assert.containsText(infoMenu, 'Notifications');
    c.expect.element(notificationsListItem).to.be.present;
  },
  'Verify that layer notices don\'t show up in the nofication list or contribute to the count': function(c) {
    c.waitForElementVisible('#notifications_info_item', TIME_LIMIT);
    c.expect.element('span.badge').to.be.present;
    c.assert.containsText('span.badge', '3');
  },
  'alert, outage, and message content is highlighted and found in modal': function(c) {
    c.click(notificationsListItem);
    c.waitForElementVisible(outageContentHightlighted, TIME_LIMIT);
    c.assert.containsText(
      `${outageContentHightlighted} span`,
      'Posted 20 May 2018',
    );
    c.assert.containsText(
      `${alertContentHightlighted} p`,
      'learn how to visualize global satellite imagery',
    );
    c.assert.containsText(
      `${messageContentHightlighted} p`,
      'This is a message test',
    );
  },
  'Verify that the user is only alerted if he has not already stored all items in localStorage': function(c) {
    c.click('#notification_list_modal .close')
      .pause(500);
    c.waitForElementVisible(infoButtonIcon, TIME_LIMIT);
    c.expect.element(`${infoButton}.wv-status-hide`).to.be.present;
  },

  // Layer notice tests
  // TODO confirm that notices in UAT don't affect this test (e.g. that mock notifications override them)
  'Verify that zots show for the layers that have notices': function(c) {
    c.waitForElementVisible(infoButtonIcon, TIME_LIMIT);
    c.expect.element(aquaZot).to.be.present;
    c.moveToElement(aquaZot, 2, 2);
    c.waitForElementVisible(tooltipSelector, TIME_LIMIT);
    c.assert.containsText(`${tooltipSelector} div:first-of-type`, aquaNotice);
    c.assert.containsText(`${tooltipSelector} div:last-of-type`, aquaTerraNotice);

    c.expect.element(terraZot).to.be.present;
    c.moveToElement(terraZot, 2, 2);
    c.waitForElementVisible(tooltipSelector, TIME_LIMIT);
    c.assert.containsText(`${tooltipSelector} div`, aquaTerraNotice);
  },
  'Verify that warning shows in the product picker next to the layers which have notices': function(c) {
    c.click(addLayers);
    c.waitForElementVisible(categoriesNav, TIME_LIMIT);
    c.click('#layer-category-item-air-quality-corrected-reflectance');
    c.moveToElement('#checkbox-case-MODIS_Aqua_CorrectedReflectance_TrueColor', 2, 2);
    c.waitForElementVisible(tooltipSelector, TIME_LIMIT);
    c.assert.containsText(`${tooltipSelector} div:first-of-type`, aquaNotice);
    c.assert.containsText(`${tooltipSelector} div:last-of-type`, aquaTerraNotice);

    c.click('#terra-modis-4-source-Nav');
    c.waitForElementVisible('#checkbox-case-MODIS_Terra_CorrectedReflectance_TrueColor', TIME_LIMIT);
    c.moveToElement('#checkbox-case-MODIS_Terra_CorrectedReflectance_TrueColor', 2, 2);
    c.waitForElementVisible(tooltipSelector, TIME_LIMIT);
    c.assert.containsText(`${tooltipSelector} div`, aquaTerraNotice);
  },
  after(c) {
    c.end();
  },
};
