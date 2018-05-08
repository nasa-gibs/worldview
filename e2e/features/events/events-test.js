const reuseables = require('../../reuseables/skip-tour.js');
const localQuerystrings = require('./querystrings.js');
const TIME_LIMIT = 10000;
/**
 * Selectors
 */
const listOfEvents = '#wv-events ul.map-item-list';
const eventIcons = '.marker .event-icon';
const firstEvent = '#wv-events ul.map-item-list .item:first-child h4';
const selectedFirstEvent = '#wv-events ul.map-item-list .item-selected:first-child h4';
const selectedMarker = '.marker-selected';
const firstExternalEventLink = '#wv-events ul.map-item-list .item:first-child .natural-event-link:first-child';
const trackMarker = '.track-marker';

module.exports = {
  before: function (client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Use Mock to make sure appropriate number of event markers are appended to map': function(client) {
    client.url(client.globals.url + localQuerystrings.mockEvents);
    client.waitForElementVisible(listOfEvents, TIME_LIMIT, function() {
      client.assert.elementCountEquals(eventIcons, 6);
    });
  },
  'Use Mock Ensure number of event track points is correct and event markers and tabs are not visible when layer tab is clicked': function(client) {
    const globalSelectors = client.globals.selectors;
    client.url(client.globals.url + localQuerystrings.mockEvents);
    client.waitForElementVisible(listOfEvents, TIME_LIMIT, function() {
      client.click(firstEvent);
      client.waitForElementVisible(trackMarker, TIME_LIMIT, function() {
        client.assert.elementCountEquals(trackMarker, 5);
        client.click(globalSelectors.dataTab)
          .pause(2000);
        client.expect.element(trackMarker).to.not.be.present;
        client.expect.element(eventIcons).to.not.be.present;
        client.click(globalSelectors.eventsTab)
          .pause(2000);
        client.expect.element(trackMarker).to.be.present;
        client.expect.element(eventIcons).to.be.present;
      });
    });
  },
  'Click Events tab and select an Event from the List': function(client) {
    const globalSelectors = client.globals.selectors;
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
    client.waitForElementVisible(globalSelectors.eventsTab, TIME_LIMIT, function() {
      client.click(globalSelectors.eventsTab);
      client.waitForElementVisible(listOfEvents, TIME_LIMIT, function() {
        client.click(firstEvent)
          .pause(3000);
        client.expect.element(selectedMarker).to.be.visible;
        client.expect.element(selectedFirstEvent).to.be.visible;
        // test url is updated
        client
          .assert.urlParameterEquals('l', true)
          .assert.urlParameterEquals('t', true)
          .assert.urlParameterEquals('z', true)
          .assert.urlParameterEquals('v', true)
          .assert.urlParameterEquals('e', true);
        client.assert.containsText(globalSelectors.notifyMessage, 'Events may not be visible at all times');
        client.click(globalSelectors.notifyMessage)
          .pause(2000);
        client.assert.containsText('.wv-data-unavailable-header', 'Why can’t I see an event?');
        client
          .click(globalSelectors.notificationDismissButton)
          .pause(2000);
        client.expect.element(globalSelectors.notificationDismissButton).to.not.be.visible;
        client.assert.elementCountGreater(globalSelectors.overlayLayerItems, 4); // At least 4 overlay layers present
        client.click(selectedFirstEvent)
          .pause(500);
        client.expect.element(selectedFirstEvent).to.not.be.present;
        client.click(firstEvent)
          .pause(500);
        client.windowHandles(function (tabs) {
          client.assert.equal(tabs.value.length, 1);
        });
        client.click(firstExternalEventLink)
          .pause(2000);
        client.windowHandles(function (tabs) {
          client.assert.equal(tabs.value.length, 2);
        });
      });
    });
  },
  after: function(client) {
    client.end();
  }
};
