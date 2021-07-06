import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get as lodashGet } from 'lodash';
import moment from 'moment';
import {
  Button,
  UncontrolledTooltip,
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
import { getSelectedDate } from '../../modules/date/selectors';
import { toggleCustomContent } from '../../modules/modal/actions';
import AlertUtil from '../../components/util/alert';
import util from '../../util/util';
import { LIMIT_EVENT_REQUEST_COUNT } from '../../modules/natural-events/constants';

function Events(props) {
  const {
    eventsData,
    sources,
    isLoading,
    selectEvent,
    selected,
    openFilterModal,
    visibleEventsInProjection,
    height,
    deselectEvent,
    hasRequestError,
    isMobile,
    isEmbedModeActive,
    showAlert,
    selectedDate,
    showDates,
    selectedStartDate,
    selectedEndDate,
    selectedCategories,
  } = props;

  const dropdownHeight = 34;
  const maxHeight = Math.max(height - dropdownHeight, 166);
  const scrollbarMaxHeight = isEmbedModeActive ? '50vh' : `${maxHeight}px`;

  const missingEventDate = selected.id && !selected.date;
  const selectedEventNotInData = !isLoading && selected.id && (eventsData || []).filter((event) => event.id === selected.id).length === 0;
  let showInactiveEventAlert = missingEventDate || selectedEventNotInData;

  const startDate = moment(selectedStartDate).format('YYYY MMM DD');
  const endDate = moment(selectedEndDate).format('YYYY MMM DD');

  const errorOrLoadingText = isLoading
    ? 'Loading ...'
    : hasRequestError
      ? 'There has been an ERROR retrieving events from the EONET events API. Please try again later.'
      : '';

  const eventLimitReach = eventsData && eventsData.length === LIMIT_EVENT_REQUEST_COUNT;

  return (
    <div className="event-container">
      <div className="filter-controls">

        <div className="filter-dates-icons">
          <div className="filter-dates">
            {showDates && `${startDate} - ${endDate}`}
          </div>

          <div className="filter-icons">
            {selectedCategories.map(({ title }) => (
              <EventIcon
                id="filter-"
                key={title}
                category={title}
                title={title}
              />
            ))}
          </div>
        </div>
        <Button
          id="event-filter-button"
          className="filter-button"
          aria-label="Filtered layer search"
          onClick={openFilterModal}
          color="primary"
          size="sm"
          block
          disabled={isLoading}
        >
          <FontAwesomeIcon icon="filter" />
        </Button>
      </div>

      <Scrollbars
        className="event-scroll-list"
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

          {eventsData && eventsData.length ? (
            <div className="wv-eventslist sidebar-panel">
              <ul id="wv-eventscontent" className="content map-item-list">
                {sources && eventsData.map((event) => (
                  <Event
                    showAlert={showAlert}
                    key={event.id}
                    event={event}
                    selectEvent={(id, date) => selectEvent(id, date, isMobile && !isEmbedModeActive)}
                    deselectEvent={isEmbedModeActive ? () => null : deselectEvent}
                    isSelected={selected.id === event.id && visibleEventsInProjection[event.id]}
                    selectedDate={selectedDate}
                    isVisible={visibleEventsInProjection[event.id]}
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

      {eventLimitReach && (
        <div className="event-count">
          Showing the first
          {` ${eventsData ? eventsData.length : ''} `}
          events
          <FontAwesomeIcon id="filter-info-icon" icon="info-circle" />
          <UncontrolledTooltip
            placement="right"
            target="filter-info-icon"
          >
            <div>
              More than
              {` ${LIMIT_EVENT_REQUEST_COUNT} `}
              events matched the current filter criteria.
            </div>
          </UncontrolledTooltip>
        </div>
      )}

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
      modalClassName: 'sidebar-modal event-filter-modal',
      timeout: 150,
    }));
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
    selected, showAll, selectedDates, selectedCategories,
  } = events;
  let visibleEventsInProjection = {};
  const mapExtent = lodashGet(state, 'map.extent');

  const { isEmbedModeActive } = embed;
  if (eventsData && mapExtent) {
    const extent = showAll ? proj.selected.maxExtent : mapExtent;
    visibleEventsInProjection = getEventsWithinExtent(
      eventsData,
      selected,
      extent,
      proj.selected,
      showAll,
    );
  }

  return {
    showAll,
    selected,
    visibleEventsInProjection,
    isPlaying: animation.isPlaying,
    isMobile: browser.lessThan.medium,
    isEmbedModeActive,
    isAnimatingToEvent: events.isAnimatingToEvent,
    selectedCategories,
    showDates: !!(selectedDates.start && selectedDates.end),
    selectedStartDate: selectedDates.start,
    selectedEndDate: selectedDates.end,
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
  isEmbedModeActive: PropTypes.bool,
  openFilterModal: PropTypes.func,
  selected: PropTypes.object,
  selectedDate: PropTypes.string,
  showDates: PropTypes.bool,
  selectedStartDate: PropTypes.string,
  selectedEndDate: PropTypes.string,
  selectedCategories: PropTypes.array,
  selectEvent: PropTypes.func,
  showAlert: PropTypes.bool,
  sources: PropTypes.array,
  visibleEventsInProjection: PropTypes.object,
};
