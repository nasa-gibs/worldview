import React, { useState } from 'react';
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
} from '../../modules/natural-events/actions';
import { getEventsWithinExtent } from '../../map/natural-events/util';
import { collapseSidebar } from '../../modules/sidebar/actions';
import { selectDate } from '../../modules/date/actions';
import getSelectedDate from '../../modules/date/selectors';

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
    visibleWithinMapExtent,
    visibleEvents,
    height,
    deselectEvent,
    hasRequestError,
    isMobile,
    showAlert,
    selectedDate,
  } = props;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const ALL_CATEGORY = 'All Event Categories';
  const [selectedCategory, selectCategory] = useState(ALL_CATEGORY);


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
        style={{ maxHeight: `${height}px` }}
        scrollBarVerticalTop={scrollBarVerticalTop}
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
  deselectEvent: (id, date) => {
    dispatch(deselectEventActionCreator());
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
    requestedEventCategories,
    config,
    proj,
    browser,
  } = state;
  const { selected, showAll } = state.events;
  const apiURL = lodashGet(state, 'config.features.naturalEvents.host');
  const isLoading = requestedEvents.isLoading
    || requestedEventSources.isLoading
    || requestedEventCategories.isLoading;
  const hasRequestError = requestedEvents.error
    || requestedEventSources.error
    || requestedEventCategories.error;
  let visibleEvents = {};
  const events = lodashGet(requestedEvents, 'response');
  const sources = lodashGet(requestedEventSources, 'response');
  const eventCategories = (events || []).reduce((categories, event) => {
    const categoryTitle = lodashGet(event, 'categories[0].title');
    if (categories.indexOf(categoryTitle) === -1) {
      categories.push(categoryTitle);
    }
    return categories;
  }, []);

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
    eventCategories,
    sources,
    showAll,
    isLoading,
    hasRequestError,
    selected,
    visibleWithinMapExtent,
    visibleEvents,
    apiURL,
    config,
    isMobile: browser.lessThan.medium,
    selectedDate: getSelectedDate(state).toISOString().split('T')[0],
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
  requestEvents: PropTypes.func,
  requestSources: PropTypes.func,
  selected: PropTypes.object,
  selectedDate: PropTypes.string,
  selectEvent: PropTypes.func,
  showAlert: PropTypes.bool,
  sources: PropTypes.array,
  visibleEvents: PropTypes.object,
  visibleWithinMapExtent: PropTypes.object,
};
