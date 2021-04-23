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
    eventsData,
    eventCategories,
    sources,
    isLoading,
    selectEvent,
    selected,
    selectCategory,
    selectedCategory,
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

  const dropdownHeight = 34;
  const scrollbarMaxHeight = height - dropdownHeight;
  let showInactiveEventAlert = selected.id && !selected.date;

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
});

const mapStateToProps = (state, ownProps) => {
  const {
    animation,
    proj,
    browser,
    events,
  } = state;
  const { eventsData } = ownProps;
  const {
    selected, showAll, category,
  } = events;
  let visibleEvents = {};
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
    eventCategories: getEventCategories(state),
    showAll,
    selected,
    visibleWithinMapExtent,
    visibleEvents,
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
  eventCategories: PropTypes.array,
  deselectEvent: PropTypes.func,
  eventsData: PropTypes.array,
  hasRequestError: PropTypes.bool,
  height: PropTypes.number,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
  selected: PropTypes.object,
  selectedDate: PropTypes.string,
  selectEvent: PropTypes.func,
  selectCategory: PropTypes.func,
  selectedCategory: PropTypes.string,
  showAlert: PropTypes.bool,
  sources: PropTypes.array,
  visibleEvents: PropTypes.object,
};
