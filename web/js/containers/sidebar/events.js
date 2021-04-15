import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get as lodashGet } from 'lodash';
import {
  Button,
} from 'reactstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Event from '../../components/sidebar/event';
import EventIcon from '../../components/sidebar/event-icon';
import EventFilter from '../../components/sidebar/events-filter';
import Scrollbars from '../../components/util/scrollbar';
import {
  selectEvent as selectEventActionCreator,
  deselectEvent as deselectEventActionCreator,
} from '../../modules/natural-events/actions';
import { getEventsWithinExtent } from '../../map/natural-events/util';
import { collapseSidebar } from '../../modules/sidebar/actions';
import { selectDate } from '../../modules/date/actions';
import getSelectedDate from '../../modules/date/selectors';
import { toggleCustomContent } from '../../modules/modal/actions';
import AlertUtil from '../../components/util/alert';
import util from '../../util/util';

function Events(props) {
  const {
    eventsData,
    sources,
    isLoading,
    selectEvent,
    selected,
    openFilterModal,
    visibleEvents,
    height,
    deselectEvent,
    hasRequestError,
    isMobile,
    showAlert,
    selectedDate,
    selectedStartDate,
    selectedEndDate,
    selectedCategories,
  } = props;


  const dropdownHeight = 34;
  const scrollbarMaxHeight = height - dropdownHeight;
  let showInactiveEventAlert = selected.id && !selected.date;

  const errorOrLoadingText = isLoading
    ? 'Loading ...'
    : hasRequestError
      ? 'There has been an ERROR retrieving events from the EONET events API. Please try again later.'
      : '';

  return (
    <div className="event-container">
      <div className="filter-controls">

        <Button
          id="event-filter-button"
          className="filter-button"
          aria-label="Filtered layer search"
          onClick={openFilterModal}
          color="primary"
          size="sm"
          block
          disable={isLoading}
        >
          <FontAwesomeIcon icon="filter" />
        </Button>

        <div className="filter-dates-icons">
          <div className="filter-dates">
            {`${selectedStartDate} - ${selectedEndDate}`}
          </div>

          <div className="filter-icons">
            {selectedCategories.map((category) => (
              <EventIcon id="filter-" category={category} title={category} />
            ))}
          </div>
        </div>
      </div>

      <Scrollbars
        style={{ maxHeight: `${scrollbarMaxHeight}px` }}
      >
        <div id="wv-events">
          {(isLoading || hasRequestError) && (
            <div className="events-loading-text">
              {hasRequestError && (<FontAwesomeIcon icon="exclamation-triangle" fixedWidth />)}
              {errorOrLoadingText}
            </div>
          )}

          {eventsData && eventsData.length ? (
            <div className="wv-eventslist sidebar-panel">
              <ul id="wv-eventscontent" className="content map-item-list">
                {sources && eventsData.map((event) => (
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
            <h3 className="no-events"> No events meet current criteria</h3>
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
  openFilterModal: () => {
    dispatch(toggleCustomContent('events-filter', {
      headerText: 'Filter Events',
      backdrop: false,
      bodyComponent: EventFilter,
      // Using clickableBehindModal: true here causes an issue where switching sidebar
      // tabs does not close this modal
      wrapClassName: 'clickable-behind-modal',
      modalClassName: ' layer-info-settings-modal layer-settings-modal',
      timeout: 150,
    }));
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
    selected, showAll, selectedStartDate, selectedEndDate, selectedCategories,
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
    eventsData,
    showAll,
    selected,
    visibleWithinMapExtent,
    visibleEvents,
    isPlaying: animation.isPlaying,
    isMobile: browser.lessThan.medium,
    selectedCategories,
    selectedStartDate: util.toISOStringDate(new Date(selectedStartDate)),
    selectedEndDate: util.toISOStringDate(new Date(selectedEndDate)),
    selectedDate: util.toISOStringDate(getSelectedDate(state)),
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Events);

Events.propTypes = {
  deselectEvent: PropTypes.func,
  eventsData: PropTypes.array,
  hasRequestError: PropTypes.bool,
  height: PropTypes.number,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
  openFilterModal: PropTypes.func,
  selected: PropTypes.object,
  selectedDate: PropTypes.string,
  selectedStartDate: PropTypes.string,
  selectedEndDate: PropTypes.string,
  selectedCategories: PropTypes.array,
  selectEvent: PropTypes.func,
  showAlert: PropTypes.bool,
  sources: PropTypes.array,
  visibleEvents: PropTypes.object,
};
