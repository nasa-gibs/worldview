const reuseables = require('../../reuseables/skip-tour.js');
const localQuerystrings = require('../../reuseables/querystrings.js');
const TIME_LIMIT = 10000;
/**
 * Selectors
 */
const listOfEvents = '#wv-events ul.map-item-list';
const eventIcons = '.marker .event-icon';
const firstEvent = '#wv-events ul.map-item-list .item:first-child h4';
const selectedFirstEvent =
  '#wv-events ul.map-item-list .item-selected:first-child h4';
const selectedMarker = '.marker-selected';
const firstExternalEventLink =
  '#wv-events ul.map-item-list .item:first-child .natural-event-link:first-child';
const trackMarker = '.track-marker';
const layersTab = '#layers-sidebar-tab';

module.exports = {
  before: function(client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT);
  },
  'Make sure that 4 fire layers are not present in layer list: use mock': function(
    client
  ) {
    client.url(client.globals.url + localQuerystrings.mockEvents);
    client.waitForElementVisible(
      '#sidebar-event-EONET_3931',
      TIME_LIMIT,
      function() {
        client.expect.element('#active-VIIRS_SNPP_Thermal_Anomalies_375m_Night')
          .to.not.be.present;
        client.expect.element('#active-VIIRS_SNPP_Thermal_Anomalies_375m_Day')
          .to.not.be.present;
        client.expect.element('#active-MODIS_Aqua_Thermal_Anomalies_All').to.not
          .be.present;
        client.expect.element('#active-MODIS_Terra_Thermal_Anomalies_All').to
          .not.be.present;
      }
    );
  },
  'Click fire event': function(client) {
    client.click('#sidebar-event-EONET_3931');
  },
  'Check that 4 fire layers are now present': function(client) {
    client.click(layersTab);
    client.waitForElementPresent(
      '#active-VIIRS_SNPP_Thermal_Anomalies_375m_Night',
      TIME_LIMIT,
      function() {
        client.expect.element('#active-VIIRS_SNPP_Thermal_Anomalies_375m_Day')
          .to.be.present;
        client.expect.element('#active-MODIS_Aqua_Thermal_Anomalies_All').to.be
          .present;
        client.expect.element('#active-MODIS_Terra_Thermal_Anomalies_All').to.be
          .present;
      }
    );
  },
  'Use Mock to make sure appropriate number of event markers are appended to map': function(
    client
  ) {
    client.url(client.globals.url + localQuerystrings.mockEvents);
    client.waitForElementVisible(listOfEvents, TIME_LIMIT, function() {
      client.assert.elementCountEquals(eventIcons, 9);
    });
  },
  'On events tab click events list is loaded': function(client) {
    client.url(client.globals.url + localQuerystrings.mockEvents);
    client.waitForElementVisible(listOfEvents, TIME_LIMIT);
  },
  'Use Mock Ensure number of event track points is correct and event markers and tabs are not visible when layer tab is clicked': function(
    client
  ) {
    const globalSelectors = client.globals.selectors;
    client.click(firstEvent);
    client.waitForElementVisible(trackMarker, TIME_LIMIT, function() {
      client.assert.elementCountEquals(trackMarker, 5);
      client.click(globalSelectors.dataTab).pause(2000);
      client.expect.element(trackMarker).to.not.be.present;
      client.expect.element(eventIcons).to.not.be.present;
      client.click(globalSelectors.eventsTab).pause(2000);
      client.expect.element(trackMarker).to.be.present;
      client.expect.element(eventIcons).to.be.present;
    });
  },
  'Click Events tab and select an Event from the List': function(client) {
    client.url(client.globals.url + localQuerystrings.mockEvents);
    client.waitForElementVisible(listOfEvents, TIME_LIMIT, function() {
      client.click(firstEvent);
      client.waitForElementVisible(selectedMarker, TIME_LIMIT, function() {
        client.expect.element(selectedFirstEvent).to.be.visible;
      });
    });
  },
  'Verify that Url is updated': function(client) {
    client.assert
      .urlParameterEquals('l', true)
      .assert.urlParameterEquals('t', true)
      .assert.urlParameterEquals('v', true)
      .assert.urlParameterEquals('e', true);
  },
  'Verify Events may not be visible at all times is visible ': function(
    client
  ) {
    const globalSelectors = client.globals.selectors;
    client.waitForElementVisible(
      globalSelectors.notifyMessage,
      TIME_LIMIT,
      function() {
        // Close the geostationary alert since it obscures the event alert
        client.click('#geostationary-alert-close').pause(500);
        client.assert.containsText(
          globalSelectors.notifyMessage,
          'Events may not be visible at all times'
        );
      }
    );
  },
  'Clicking event notifcation opens explanation in dialog': function(client) {
    const globalSelectors = client.globals.selectors;

    client.click(globalSelectors.notifyMessage).pause(2000);
    client.assert.containsText(
      '#event_visibility_info .wv-data-unavailable-header',
      'Why can’t I see an event?'
    );
    client.click('#event_visibility_info .close').pause(2000);
    client.expect.element('#event_visibility_info').to.not.be.present;
    client.click(globalSelectors.notificationDismissButton).pause(2000);
    client.expect.element(globalSelectors.notificationDismissButton).to.not.be
      .present;
  },
  'Clicking selected event deselects event': function(client) {
    client.click(selectedFirstEvent).pause(500);
    client.expect.element(selectedFirstEvent).to.not.be.present;
  },
  'Check that clicking eternal link opens in new window': function(client) {
    client.click(firstEvent).pause(500);
    client.windowHandles(function(tabs) {
      client.assert.equal(tabs.value.length, 1);
    });
    client.click(firstExternalEventLink).pause(2000);
    client.windowHandles(function(tabs) {
      client.assert.equal(tabs.value.length, 2);
    });
  },
  after: function(client) {
    client.end();
  }
};
