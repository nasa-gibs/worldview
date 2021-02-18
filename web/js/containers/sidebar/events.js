import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get as lodashGet } from 'lodash';
import {
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
} from 'reactstrap';
import Event from '../../components/sidebar/event';
import Scrollbars from '../../components/util/scrollbar';
import {
  requestEvents as requestEventsActionCreator,
  requestSources as requestSourcesActionCreator,
  selectEvent as selectEventActionCreator,
  deselectEvent as deselectEventActionCreator,
  selectCategory as selectCategoryActionCreator,
} from '../../modules/natural-events/actions';
import { ALL_CATEGORY } from '../../modules/natural-events/constants';
import { getEventsWithinExtent } from '../../map/natural-events/util';
import { collapseSidebar } from '../../modules/sidebar/actions';
import { selectDate } from '../../modules/date/actions';
import getSelectedDate from '../../modules/date/selectors';
import { getEventCategories } from '../../modules/natural-events/selectors';
import AlertUtil from '../../components/util/alert';

function Events(props) {
  const {
    requestSources,
    requestEvents,
    apiURL,
    config,
    events,
    eventCategories,
    sources,
    isLoading,
    selectEvent,
    selected,
    selectCategory,
    selectedCategory,
    prevSelected,
    visibleWithinMapExtent,
    visibleEvents,
    height,
    deselectEvent,
    hasRequestError,
    isMobile,
    showAlert,
    selectedDate,
    proj,
  } = props;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const dropdownHeight = 34;
  const scrollbarMaxHeight = height - dropdownHeight;
  let showInactiveEventAlert = selected.id && !selected.date;

  const initRequests = () => {
    let eventsRequestURL = `${apiURL}/events`;
    let sourceRequestURL = `${apiURL}/sources`;

    const mockEvents = lodashGet(config, 'parameters.mockEvents');
    const mockSources = lodashGet(config, 'parameters.mockSources');

    if (mockEvents) {
      console.warn(`Using mock events data: ${mockEvents}`);
      eventsRequestURL = mockEvents === 'true'
        ? 'mock/events_data.json'
        : `mock/events_data.json-${mockEvents}`;
    }
    if (mockSources) {
      console.warn(`Using mock categories data: ${mockSources}`);
      sourceRequestURL = `mock/categories_data.json-${mockSources}`;
    }
    requestEvents(eventsRequestURL);
    requestSources(sourceRequestURL);
  };

  if (!isLoading && !hasRequestError && !events) {
    initRequests();
  }

  useEffect(() => {
    if (selected.id && selected.date && !visibleWithinMapExtent[selected.id] && events && events.length) {
      deselectEvent();
    }
  });

  useEffect(() => {
    if (!selected.id && prevSelected && visibleWithinMapExtent[prevSelected.id]) {
      selectEvent(prevSelected.id, prevSelected.date, isMobile);
    }
  }, [proj]);

  const errorOrLoadingText = isLoading
    ? 'Loading...'
    : hasRequestError
      ? 'There has been an ERROR retrieving events from the EONET events API'
      : '';

  const eventsForSelectedCategory = !isLoading && (events || []).filter((event) => {
    if (selectedCategory === ALL_CATEGORY) return event;
    if (event.categories.find((category) => category.title === selectedCategory)) {
      return event;
    }
    return false;
  });

  return (
    <div className="event-container">
      <Dropdown id="event-category-dropdown" isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle caret>
          {selectedCategory}
        </DropdownToggle>
        <DropdownMenu id="event-category-menu">
          <DropdownItem
            id="event-category-item-all"
            active={selectedCategory === ALL_CATEGORY}
            onClick={() => selectCategory(ALL_CATEGORY)}
          >
            {ALL_CATEGORY}
          </DropdownItem>
          {
            !isLoading && eventCategories.map((category) => (
              <DropdownItem
                id={`event-category-item-${category.toLowerCase()}`}
                key={category}
                onClick={() => selectCategory(category)}
                active={category === selectedCategory}
              >
                {category}
              </DropdownItem>
            ))
          }
        </DropdownMenu>
      </Dropdown>

      <Scrollbars
        style={{ maxHeight: `${scrollbarMaxHeight}px` }}
      >
        <div id="wv-events">
          {(isLoading || hasRequestError) && (
            <div className="events-loading-text">
              {errorOrLoadingText}
            </div>
          )}

          {eventsForSelectedCategory.length ? (
            <div className="wv-eventslist sidebar-panel">
              <ul id="wv-eventscontent" className="content map-item-list">
                {sources && eventsForSelectedCategory.map((event) => (
                  <Event
                    showAlert={showAlert}
                    key={event.id}
                    event={event}
                    selectEvent={(id, date) => selectEvent(id, date, isMobile)}
                    deselectEvent={deselectEvent}
                    isSelected={selected.id === event.id && visibleEvents[event.id]}
                    selectedDate={selectedDate}
                    isVisible={visibleEvents[event.id]}
                    sources={sources}
                  />
                ))}
              </ul>
            </div>
          ) : !isLoading && (
            <h3 className="no-events"> No events in this category.</h3>
          )}
        </div>
      </Scrollbars>

      {showInactiveEventAlert && (
        <AlertUtil
          id="event-unavailable-alert"
          isOpen
          onDismiss={() => { showInactiveEventAlert = false; }}
          message={`The event with an id of ${selected.id} is no longer active.`}
        />
      )}
    </div>
  );
}

const mapDispatchToProps = (dispatch) => ({
  selectEvent: (id, dateStr, isMobile) => {
    dispatch(selectEventActionCreator(id, dateStr));
    if (isMobile) {
      dispatch(collapseSidebar());
    }
    if (dateStr) {
      dispatch(selectDate(new Date(dateStr)));
    }
  },
  deselectEvent: () => {
    dispatch(deselectEventActionCreator());
  },
  selectCategory: (category) => {
    dispatch(selectCategoryActionCreator(category));
  },
  requestEvents: (url) => {
    dispatch(requestEventsActionCreator(url));
  },
  requestSources: (url) => {
    dispatch(requestSourcesActionCreator(url));
  },
});

const mapStateToProps = (state) => {
  const {
    requestedEvents,
    requestedEventSources,
    config,
    proj,
    browser,
  } = state;
  const {
    selected, prevSelected, showAll, category,
  } = state.events;
  const apiURL = lodashGet(state, 'config.features.naturalEvents.host');
  const isLoading = requestedEvents.isLoading
    || requestedEventSources.isLoading;
  const hasRequestError = requestedEvents.error
    || requestedEventSources.error;
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
      true,
    );
    const extent = showAll ? proj.selected.maxExtent : mapExtent;
    visibleEvents = getEventsWithinExtent(
      events,
      selected,
      extent,
      proj.selected,
      showAll,
    );
  }

  return {
    events,
    eventCategories: getEventCategories(state),
    sources,
    showAll,
    isLoading,
    hasRequestError,
    selected,
    prevSelected,
    proj,
    visibleWithinMapExtent,
    visibleEvents,
    apiURL,
    config,
    isMobile: browser.lessThan.medium,
    selectedDate: getSelectedDate(state).toISOString().split('T')[0],
    selectedCategory: category,
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Events);

Events.propTypes = {
  apiURL: PropTypes.string,
  eventCategories: PropTypes.array,
  config: PropTypes.object,
  deselectEvent: PropTypes.func,
  events: PropTypes.array,
  hasRequestError: PropTypes.bool,
  height: PropTypes.number,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
  prevSelected: PropTypes.object,
  proj: PropTypes.object,
  requestEvents: PropTypes.func,
  requestSources: PropTypes.func,
  selected: PropTypes.object,
  selectedDate: PropTypes.string,
  selectEvent: PropTypes.func,
  selectCategory: PropTypes.func,
  selectedCategory: PropTypes.string,
  showAlert: PropTypes.bool,
  sources: PropTypes.array,
  visibleEvents: PropTypes.object,
  visibleWithinMapExtent: PropTypes.object,
};
