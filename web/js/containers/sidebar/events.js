import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get as lodashGet } from 'lodash';
import {
  Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
import { getSelectedDate } from '../../modules/date/selectors';
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
    isEmbedModeActive,
    showAlert,
    selectedDate,
  } = props;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const dropdownHeight = 34;
  const maxHeight = Math.max(height - dropdownHeight, 166);
  const scrollbarMaxHeight = isEmbedModeActive ? '50vh' : `${maxHeight}px`;

  const missingEventDate = selected.id && !selected.date;
  const selectedEventNotInData = !isLoading && selected.id && (eventsData || []).filter((event) => event.id === selected.id).length === 0;
  let showInactiveEventAlert = missingEventDate || selectedEventNotInData;

  const errorOrLoadingText = isLoading
    ? 'Loading...'
    : hasRequestError
      ? 'There has been an ERROR retrieving events from the EONET events API. Please try again later.'
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
      {!isEmbedModeActive && (
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
      )}
      <Scrollbars
        style={{ maxHeight: `${scrollbarMaxHeight}` }}
      >
        <div id="wv-events">
          {(isLoading || hasRequestError || (isEmbedModeActive && showInactiveEventAlert)) && (
            <div className="events-loading-text">
              {hasRequestError && (<FontAwesomeIcon icon="exclamation-triangle" fixedWidth />)}
              {errorOrLoadingText}
              {(isEmbedModeActive && showInactiveEventAlert) && (
                <>
                  <br />
                  {`The event with an id of ${selected.id} is no longer active.`}
                </>
              )}
            </div>
          )}

          {eventsForSelectedCategory.length ? (
            <div className="wv-eventslist sidebar-panel">
              <ul id="wv-eventscontent" className="content map-item-list">
                {sources && eventsForSelectedCategory.filter((event) => (isEmbedModeActive ? selected.id === event.id : true)).map((event) => (
                  <Event
                    showAlert={showAlert}
                    key={event.id}
                    event={event}
                    selectEvent={(id, date) => selectEvent(id, date, isMobile && !isEmbedModeActive)}
                    deselectEvent={isEmbedModeActive ? () => null : deselectEvent}
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
  selectEvent: (id, dateStr, shouldCollapse) => {
    dispatch(selectEventActionCreator(id, dateStr));
    if (shouldCollapse) {
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
    embed,
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

  const { isEmbedModeActive } = embed;
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
    isEmbedModeActive,
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
  isEmbedModeActive: PropTypes.bool,
  selected: PropTypes.object,
  selectedDate: PropTypes.string,
  selectEvent: PropTypes.func,
  selectCategory: PropTypes.func,
  selectedCategory: PropTypes.string,
  showAlert: PropTypes.bool,
  sources: PropTypes.array,
  visibleEvents: PropTypes.object,
};
