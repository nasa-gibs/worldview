import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import {
  Button,
} from 'reactstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Event from '../../components/sidebar/event';
import EventIcon from '../../components/sidebar/event-icon';
import EventFilterModalBody from '../../components/sidebar/events-filter';
import Scrollbars from '../../components/util/scrollbar';
import {
  selectEvent as selectEventActionCreator,
  deselectEvent as deselectEventActionCreator,
} from '../../modules/natural-events/actions';
import { collapseSidebar } from '../../modules/sidebar/actions';
import { getSelectedDate } from '../../modules/date/selectors';
import { toggleCustomContent } from '../../modules/modal/actions';
import util from '../../util/util';

function Events(props) {
  const {
    eventsData,
    sources,
    isLoading,
    selectEvent,
    selected,
    openFilterModal,
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

  const filterControlHeight = 72;
  const maxHeight = Math.max(height - filterControlHeight, 166);
  const scrollbarMaxHeight = isEmbedModeActive ? '50vh' : `${maxHeight}px`;

  const startDate = moment(selectedStartDate).format('YYYY MMM DD');
  const endDate = moment(selectedEndDate).format('YYYY MMM DD');

  const errorOrLoadingText = isLoading
    ? 'Loading ...'
    : hasRequestError
      ? 'There has been an ERROR retrieving events from the EONET events API. Please try again later.'
      : '';


  const renderFilterControls = () => (
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
  );

  const renderEventList = () => (
    <Scrollbars
      className="event-scroll-list"
      style={{ maxHeight: `${scrollbarMaxHeight}` }}
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
                  isSelected={selected.id === event.id}
                  selectedDate={selectedDate}
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
  );

  return (
    <div className="event-container">
      {renderFilterControls()}
      {renderEventList()}
    </div>
  );
}

const mapDispatchToProps = (dispatch) => ({
  selectEvent: (id, dateStr, shouldCollapse) => {
    dispatch(selectEventActionCreator(id, dateStr));
    if (shouldCollapse) {
      dispatch(collapseSidebar());
    }
  },
  deselectEvent: () => {
    dispatch(deselectEventActionCreator());
  },
  openFilterModal: () => {
    dispatch(toggleCustomContent('events-filter', {
      headerText: 'Filter Events',
      backdrop: false,
      bodyComponent: EventFilterModalBody,
      footer: true,
      modalClassName: 'sidebar-modal event-filter-modal',
      timeout: 150,
    }));
  },
});

const mapStateToProps = (state) => {
  const {
    animation,
    embed,
    browser,
    events,
  } = state;

  const {
    selected, showAll, selectedDates, selectedCategories,
  } = events;
  const { isEmbedModeActive } = embed;

  return {
    isPlaying: animation.isPlaying,
    isMobile: browser.lessThan.medium,
    isEmbedModeActive,
    isAnimatingToEvent: events.isAnimatingToEvent,
    showAll,
    showDates: !!(selectedDates.start && selectedDates.end),
    selected,
    selectedCategories,
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
};
