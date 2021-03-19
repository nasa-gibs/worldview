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
import util from '../../util/util';

function Events(props) {
  const {
    requestSources,
    requestEvents,
    apiURL,
    config,
    eventsData,
    eventCategories,
    sources,
    isPlaying,
    isLoading,
    selectEvent,
    selected,
    selectCategory,
    selectedCategory,
    visibleWithinMapExtent,
    visibleEvents,
    height,
    deselectEvent,
    hasRequestError,
    isMobile,
    showAlert,
    selectedDate,
    updateEventSelect,
    isAnimatingToEvent,
  } = props;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const dropdownHeight = 34;
  const scrollbarMaxHeight = height - dropdownHeight;
  let showInactiveEventAlert = selected.id && !selected.date;

  // init requests
  useEffect(() => {
    if (!isLoading && !hasRequestError && !eventsData) {
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
    }
  });

  // Deselect event if it's not visible in the map extent
  useEffect(() => {
    if (selected.id && selected.date && !visibleWithinMapExtent[selected.id] && eventsData && eventsData.length) {
      deselectEvent();
    }
  });

  // If the date was changed to one that this event has, re-select it to move the marker
  useEffect(() => {
    if (isPlaying || isAnimatingToEvent) return;
    const geometry = selected.eventObject && selected.eventObject.geometry;
    const geometryForDate = (geometry || []).find((g) => g.date.split('T')[0] === selectedDate);
    if (geometryForDate) {
      updateEventSelect(selected.id, selectedDate);
    }
  }, [selectedDate]);

  const errorOrLoadingText = isLoading
    ? 'Loading...'
    : hasRequestError
      ? 'There has been an ERROR retrieving events from the EONET events API'
      : '';

  const eventsForSelectedCategory = !isLoading && (eventsData || []).filter((event) => {
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
  updateEventSelect: (id, dateStr) => {
    dispatch(selectEventActionCreator(id, dateStr));
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
    animation,
    requestedEvents,
    requestedEventSources,
    config,
    proj,
    browser,
    events,
  } = state;
  const {
    selected, showAll, category,
  } = events;
  const apiURL = lodashGet(state, 'config.features.naturalEvents.host');
  const isLoading = requestedEvents.isLoading
    || requestedEventSources.isLoading;
  const hasRequestError = requestedEvents.error
    || requestedEventSources.error;
  let visibleEvents = {};
  const eventsData = lodashGet(requestedEvents, 'response');
  const sources = lodashGet(requestedEventSources, 'response');
  const mapExtent = lodashGet(state, 'map.extent');
  let visibleWithinMapExtent = {};

  if (eventsData && mapExtent) {
    visibleWithinMapExtent = getEventsWithinExtent(
      eventsData,
      selected,
      proj.selected.maxExtent,
      proj.selected,
      true,
    );
    const extent = showAll ? proj.selected.maxExtent : mapExtent;
    visibleEvents = getEventsWithinExtent(
      eventsData,
      selected,
      extent,
      proj.selected,
      showAll,
    );
  }

  return {
    eventsData,
    eventCategories: getEventCategories(state),
    sources,
    showAll,
    isLoading,
    hasRequestError,
    selected,
    visibleWithinMapExtent,
    visibleEvents,
    apiURL,
    config,
    isPlaying: animation.isPlaying,
    isMobile: browser.lessThan.medium,
    isAnimatingToEvent: events.isAnimatingToEvent,
    selectedDate: util.toISOStringDate(getSelectedDate(state)),
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
  eventsData: PropTypes.array,
  hasRequestError: PropTypes.bool,
  height: PropTypes.number,
  isPlaying: PropTypes.bool,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
  isAnimatingToEvent: PropTypes.bool,
  requestEvents: PropTypes.func,
  requestSources: PropTypes.func,
  selected: PropTypes.object,
  selectedDate: PropTypes.string,
  selectEvent: PropTypes.func,
  selectCategory: PropTypes.func,
  selectedCategory: PropTypes.string,
  showAlert: PropTypes.bool,
  sources: PropTypes.array,
  updateEventSelect: PropTypes.func,
  visibleEvents: PropTypes.object,
  visibleWithinMapExtent: PropTypes.object,
};
