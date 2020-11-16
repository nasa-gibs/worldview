const reuseables = require('../../reuseables/skip-tour.js');
const localQuerystrings = require('../../reuseables/querystrings.js');

const TIME_LIMIT = 10000;
/**
 * Selectors
 */
const listOfEvents = '#wv-events ul.map-item-list';
const eventIcons = '.marker .event-icon';
const firstEvent = '#wv-events ul.map-item-list .item:first-child h4';
const secondEvent = '#wv-events #sidebar-event-EONET_99999';
const selectedFirstEvent = '#wv-events ul.map-item-list .item-selected:first-child h4';
const selectedMarker = '.marker-selected';
const firstExternalEventLink = '#wv-events ul.map-item-list .item:first-child .natural-event-link:first-child';
const trackMarker = '.track-marker';
const layersTab = '#layers-sidebar-tab';

module.exports = {
  before(c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
  },
  'Loading an inactive event shows an alert': (c) => {
    const inactiveEventAlert = '#event-unavailable-alert';
    const inactiveAlertMsgContainer = `${inactiveEventAlert} .wv-alert-message`;
    const inactiveEventMsg = 'The event with an id of EONET_5133 is no longer active.';

    c.url(c.globals.url + localQuerystrings.closedEvent);
    c.waitForElementVisible(inactiveEventAlert, TIME_LIMIT);
    c.expect.element(inactiveEventAlert).to.be.present;
    c.assert.containsText(inactiveAlertMsgContainer, inactiveEventMsg);
  },
  'Make sure that 4 fire layers are not present in layer list: use mock': (c) => {
    c.url(c.globals.url + localQuerystrings.mockEvents);
    c.waitForElementVisible(
      '#sidebar-event-EONET_3931',
      TIME_LIMIT,
      () => {
        c.expect.element('#active-VIIRS_SNPP_Thermal_Anomalies_375m_Night')
          .to.not.be.present;
        c.expect.element('#active-VIIRS_SNPP_Thermal_Anomalies_375m_Day')
          .to.not.be.present;
        c.expect.element('#active-VIIRS_NOAA20_Thermal_Anomalies_375m_Day').to.not
          .be.present;
        c.expect.element('#active-VIIRS_NOAA20_Thermal_Anomalies_375m_Night').to
          .not.be.present;
      },
    );
  },
  'Click fire event': (c) => {
    c.click('#sidebar-event-EONET_3931');
  },
  'Check that 4 fire layers are now present': (c) => {
    c.click(layersTab);
    c.waitForElementPresent(
      '#active-VIIRS_SNPP_Thermal_Anomalies_375m_Night',
      TIME_LIMIT,
      () => {
        c.expect.element('#active-VIIRS_SNPP_Thermal_Anomalies_375m_Day')
          .to.be.present;
        c.expect.element('#active-VIIRS_NOAA20_Thermal_Anomalies_375m_Day').to.be
          .present;
        c.expect.element('#active-VIIRS_NOAA20_Thermal_Anomalies_375m_Night').to.be
          .present;
      },
    );
  },
  'Use Mock to make sure appropriate number of event markers are appended to map': (c) => {
    c.url(c.globals.url + localQuerystrings.mockEvents);
    c.waitForElementVisible(listOfEvents, TIME_LIMIT, () => {
      c.expect.elements(eventIcons).count.to.equal(9);
    });
  },
  'On events tab click events list is loaded': (c) => {
    c.url(c.globals.url + localQuerystrings.mockEvents);
    c.waitForElementVisible(listOfEvents, TIME_LIMIT);
  },
  'Use Mock to ensure number of event track points is correct and event markers and tabs are not visible when layer tab is clicked': (c) => {
    const globalSelectors = c.globals.selectors;
    c.click(secondEvent);
    c.waitForElementVisible(trackMarker, TIME_LIMIT, () => {
      c.expect.elements(trackMarker).count.to.equal(5);
      c.click(globalSelectors.dataTab).pause(2000);
      c.expect.element(trackMarker).to.not.be.present;
      c.expect.element(eventIcons).to.not.be.present;
      c.click(globalSelectors.eventsTab).pause(2000);
      c.expect.element(trackMarker).to.be.present;
      c.expect.element(eventIcons).to.be.present;
    });
  },
  'Click Events tab and select an Event from the List': (c) => {
    c.url(c.globals.url + localQuerystrings.mockEvents);
    c.waitForElementVisible(listOfEvents, TIME_LIMIT, () => {
      c.click(firstEvent);
      c.waitForElementVisible(selectedMarker, TIME_LIMIT, () => {
        c.expect.element(selectedFirstEvent).to.be.visible;
      });
    });
  },
  'Verify that Url is updated': (c) => {
    c.assert
      .urlParameterEquals('l', true)
      .assert.urlParameterEquals('t', true)
      .assert.urlParameterEquals('v', true)
      .assert.urlParameterEquals('e', true);
  },
  'Verify Events may not be visible at all times is visible ': (c) => {
    const globalSelectors = c.globals.selectors;
    c.waitForElementVisible(
      globalSelectors.notifyMessage,
      TIME_LIMIT,
      () => {
        c.assert.containsText(
          globalSelectors.notifyMessage,
          'Events may not be visible at all times',
        );
      },
    );
  },
  'Clicking event notification opens explanation in dialog': (c) => {
    const globalSelectors = c.globals.selectors;

    c.click(globalSelectors.notifyMessage).pause(2000);
    c.assert.containsText(
      '#event_visibility_info .wv-data-unavailable-header',
      'Why can’t I see an event?',
    );
    c.click('#event_visibility_info .close').pause(2000);
    c.expect.element('#event_visibility_info').to.not.be.present;
    c.click(globalSelectors.notificationDismissButton).pause(2000);
    c.expect.element(globalSelectors.notificationDismissButton).to.not.be
      .present;
  },
  'Clicking selected event deselects event': (c) => {
    c.click(selectedFirstEvent).pause(500);
    c.expect.element(selectedFirstEvent).to.not.be.present;
  },
  'Check that clicking eternal link opens in new window': (c) => {
    c.click(firstEvent).pause(500);
    c.windowHandles((tabs) => {
      c.assert.equal(tabs.value.length, 1);
    });
    c.click(firstExternalEventLink).pause(2000);
    c.windowHandles((tabs) => {
      c.assert.equal(tabs.value.length, 2);
    });
  },
  after(c) {
    c.end();
  },
};
