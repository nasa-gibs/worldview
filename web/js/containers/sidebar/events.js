import React from 'react';
import PropTypes from 'prop-types';
import Event from '../../components/sidebar/event';
import Scrollbars from '../../components/util/scrollbar';
import { connect } from 'react-redux';
import AlertUtil from '../../components/util/alert';
import { openCustomContent } from '../../modules/modal/actions';
import {
  requestEvents,
  requestCategories,
  requestSources,
  selectEvent,
  deselectEvent
} from '../../modules/natural-events/actions';
import util from '../../util/util';
import { EventsAlertModalBody } from '../../components/events/alert-body';
import { getEventsWithinExtent } from '../../modules/natural-events/selectors';
import { get as lodashGet } from 'lodash';
import { collapseSidebar } from '../../modules/sidebar/actions';
import { selectDate } from '../../modules/date/actions';

class Events extends React.Component {
  constructor(props) {
    super(props);
    this.initRequests();
    this.state = {
      showAlert: util.browser.localStorage && !localStorage.getItem('dismissedEventVisibilityAlert')
    };
    this.dismissAlert = this.dismissAlert.bind(this);
  }

  initRequests() {
    const {
      requestSources,
      requestCategories,
      requestEvents,
      apiURL,
      config
    } = this.props;

    let eventsRequestURL = apiURL + '/events';
    let categoryRequestURL = apiURL + '/categories';
    let sourceRequestURL = apiURL + '/sources';

    const mockEvents = lodashGet(config, 'parameters.mockEvents');
    const mockCategories = lodashGet(config, 'parameters.mockCategories');
    const mockSources = lodashGet(config, 'parameters.mockSources');

    if (mockEvents) {
      console.warn('Using mock events data: ' + mockEvents);
      eventsRequestURL =
        mockEvents === 'true'
          ? 'mock/events_data.json'
          : 'mock/events_data.json-' + mockEvents;
    }
    if (mockCategories) {
      console.warn('Using mock categories data: ' + mockCategories);
      categoryRequestURL = 'mock/categories_data.json-' + mockCategories;
    }
    if (mockSources) {
      console.warn('Using mock categories data: ' + mockSources);
      sourceRequestURL = 'mock/categories_data.json-' + mockSources;
    }
    requestEvents(eventsRequestURL);
    requestCategories(categoryRequestURL);
    requestSources(sourceRequestURL);
  }

  dismissAlert() {
    localStorage.setItem('dismissedEventVisibilityAlert', true);
    this.setState({ showAlert: false });
  }

  render() {
    const {
      events,
      isLoading,
      selectEvent,
      selected,
      visibleWithinMapExtent,
      visibleEvents,
      sources,
      height,
      deselectEvent,
      hasRequestError,
      isMobile,
      openAlertModal,
      showAlert,
      selectedDate
    } = this.props;
    if (selected.id && !visibleWithinMapExtent[selected.id] && events && events.length) {
      deselectEvent();
    }
    const errorOrLoadingText = isLoading
      ? 'Loading...'
      : hasRequestError
        ? 'There has been an ERROR retrieving events from the EONET events API'
        : '';

    let scrollBarVerticalTop = 0;
    if (visibleEvents && selected.id) {
      // find index for scrollBarVerticalTop calculation on selected event
      const index = Object.keys(visibleEvents).indexOf(selected.id);
      // 12 === li total top/bottom padding
      // 32.2 === li height (varies slightly, Chrome 100% browser zoom height used)
      scrollBarVerticalTop = index ? index * (12 + 32.2) : 0;
    }

    return (
      <React.Fragment>
        {showAlert && this.state.showAlert ? (
          <AlertUtil
            isOpen={true}
            onClick={openAlertModal}
            onDismiss={this.dismissAlert}
            message="Events may not be visible at all times."
          />
        ) : (
          ''
        )}
        <Scrollbars
          style={{ maxHeight: height + 'px' }}
          scrollBarVerticalTop={ scrollBarVerticalTop }
        >
          <div id="wv-events">
            <span
              className="events-loading-text"
              style={
                isLoading || hasRequestError
                  ? { display: 'block' }
                  : { display: 'none' }
              }
            >
              {errorOrLoadingText}
            </span>

            <div
              className="wv-eventslist sidebar-panel"
              style={events ? { display: 'block' } : { display: 'none' }}
            >
              <ul id="wv-eventscontent" className="content map-item-list">
                {events && sources
                  ? events.map(event => (
                    <Event
                      showAlert={showAlert}
                      key={event.id}
                      event={event}
                      selectEvent={(id, date) =>
                        selectEvent(id, date, isMobile)
                      }
                      deselectEvent={deselectEvent}
                      isSelected={
                        selected.id === event.id && visibleEvents[event.id]
                      }
                      selectedDate={selectedDate}
                      isVisible={visibleEvents[event.id]}
                      sources={sources}
                    />
                  ))
                  : ''}
              </ul>
            </div>
          </div>
        </Scrollbars>
      </React.Fragment>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  selectEvent: (id, dateStr, isMobile) => {
    dispatch(selectEvent(id, dateStr));
    if (isMobile) {
      dispatch(collapseSidebar());
    }
    if (dateStr) {
      dispatch(selectDate(new Date(dateStr)));
    }
  },
  openAlertModal: () => {
    dispatch(
      openCustomContent('event_visibility_info', {
        headerText: 'Events may not be visible at all times.',
        backdrop: false,
        size: 'lg',
        wrapClassName: 'clickable-behind-modal',
        bodyComponent: EventsAlertModalBody,
        desktopOnly: true
      })
    );
  },
  deselectEvent: (id, date) => {
    dispatch(deselectEvent());
  },
  requestEvents: url => {
    dispatch(requestEvents(url));
  },
  requestSources: url => {
    dispatch(requestSources(url));
  },
  requestCategories: url => {
    dispatch(requestCategories(url));
  }
});
function mapStateToProps(state) {
  const {
    requestedEvents,
    requestedEventSources,
    requestedEventCategories,
    config,
    proj,
    browser,
    sidebar,
    date,
    compare
  } = state;
  const { selected, showAll } = state.events;
  const activeDatestr = compare.isCompareA ? 'selected' : 'selectedB';
  const apiURL = lodashGet(state, 'config.features.naturalEvents.host');
  const isLoading =
    requestedEvents.isLoading ||
    requestedEventSources.isLoading ||
    requestedEventCategories.isLoading;
  const hasRequestError =
    requestedEvents.error ||
    requestedEventSources.error ||
    requestedEventCategories.error;
  let visibleEvents = {};
  const events = lodashGet(requestedEvents, 'response');
  const sources = lodashGet(requestedEventSources, 'response');
  const mapExtent = lodashGet(state, 'map.extent');
  let visibleWithinMapExtent = {};
  if (events && mapExtent) {
    visibleWithinMapExtent = getEventsWithinExtent(
      events,
      selected,
      proj.selected.maxExtent,
      proj.selected,
      true
    );
    const extent = showAll ? proj.selected.maxExtent : mapExtent;
    visibleEvents = getEventsWithinExtent(
      events,
      selected,
      extent,
      proj.selected,
      showAll
    );
  }

  const showAlert = Boolean(
    util.browser.localStorage &&
      selected.id &&
      sidebar.activeTab === 'events' &&
      browser.greaterThan.small &&
      !localStorage.getItem('dismissedEventVisibilityAlert')
  );
  return {
    events,
    showAll,
    isLoading,
    hasRequestError,
    sources,
    selected,
    visibleWithinMapExtent,
    visibleEvents,
    apiURL,
    config,
    isMobile: browser.lessThan.medium,
    showAlert,
    selectedDate: date[activeDatestr].toISOString().split('T')[0]
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Events);

Events.propTypes = {
  apiURL: PropTypes.string,
  config: PropTypes.object,
  deselectEvent: PropTypes.func,
  events: PropTypes.array,
  hasRequestError: PropTypes.bool,
  height: PropTypes.number,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
  openAlertModal: PropTypes.func,
  requestCategories: PropTypes.func,
  requestedEvents: PropTypes.object,
  requestEvents: PropTypes.func,
  requestSources: PropTypes.func,
  selected: PropTypes.object,
  selectedDate: PropTypes.string,
  selectEvent: PropTypes.func,
  showAlert: PropTypes.bool,
  showAll: PropTypes.bool,
  sources: PropTypes.array,
  visibleEvents: PropTypes.object,
  visibleWithinMapExtent: PropTypes.object
};
