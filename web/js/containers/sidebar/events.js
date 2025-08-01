import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Button,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isMobileOnly, isTablet } from 'react-device-detect';
import Event from '../../components/sidebar/event';
import EventIcon from '../../components/sidebar/event-icon';
import EventFilterModalBody from '../../components/sidebar/events-filter';
import Scrollbars from '../../components/util/scrollbar';
import {
  selectEvent as selectEventActionCreator,
  deselectEvent as deselectEventActionCreator,
  highlightEvent as highlightEventActionCreator,
  unHighlightEvent as unHighlightEventActionCreator,
} from '../../modules/natural-events/actions';
import { collapseSidebar } from '../../modules/sidebar/actions';
import { getSelectedDate } from '../../modules/date/selectors';
import { toggleCustomContent } from '../../modules/modal/actions';
import {
  addLayer as addLayerAction,
  removeGroup as removeGroupAction,
  toggleVisibility as toggleVisibilityAction,
  toggleGroupVisibility as toggleGroupVisibilityAction,
} from '../../modules/layers/actions';
import util from '../../util/util';
import { formatDisplayDate } from '../../modules/date/util';

function Events(props) {
  const {
    defaultEventLayer,
    deselectEvent,
    eventLayers,
    eventsData,
    hasRequestError,
    height,
    highlighted,
    highlightEvent,
    isLoading,
    isMobile,
    isEmbedModeActive,
    layers,
    openFilterModal,
    removeGroup,
    selectedDate,
    selected,
    selectEvent,
    selectedStartDate,
    selectedEndDate,
    selectedCategories,
    showAlert,
    showDates,
    sources,
    toggleVisibility,
    toggleGroupVisibility,
    unHighlightEvent,
  } = props;

  const filterControlHeight = 115;
  const maxHeight = Math.max(height - filterControlHeight, 166);
  const scrollbarMaxHeight = isEmbedModeActive ? '50vh' : `${maxHeight}px`;

  const startDate = formatDisplayDate(selectedStartDate);
  const endDate = formatDisplayDate(selectedEndDate);

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
          {selectedCategories.map(({ title, id }) => (
            <EventIcon
              id="filter-"
              key={id}
              category={id}
              title={title}
            />
          ))}
        </div>
      </div>
      <Button
        id="event-filter-button"
        className={isEmbedModeActive ? 'filter-button-hidden' : 'filter-button'}
        aria-label="Filtered layer search"
        onClick={openFilterModal}
        color="primary"
        size="sm"
        block
        disabled={isLoading}
      >
        <FontAwesomeIcon icon="filter" widthAuto />
      </Button>
    </div>
  );
  const renderEventList = () => (
    eventsData && eventsData.length ? (
      <div className="wv-eventslist sidebar-panel">
        <ul id="wv-eventscontent" className="content map-item-list">
          {sources && eventsData.map((event) => (
            <Event
              showAlert={showAlert}
              key={event.id}
              event={event}
              selectEvent={(id, date) => selectEvent(id, date, isMobile)}
              deselectEvent={deselectEvent}
              highlightEvent={(id, date) => highlightEvent(id, date)}
              unHighlightEvent={unHighlightEvent}
              removeGroup={removeGroup}
              eventLayers={eventLayers}
              toggleVisibility={toggleVisibility}
              toggleGroupVisibility={toggleGroupVisibility}
              isSelected={selected.id === event.id}
              isHighlighted={highlighted.id === event.id}
              selectedDate={selectedDate}
              sources={sources}
              defaultEventLayer={defaultEventLayer}
              layers={layers}
            />
          ))}
        </ul>
      </div>
    ) : !isLoading && (
      <h3 className="no-events"> No events meet current criteria</h3>
    )
  );

  return (
    <div className="event-container">
      {renderFilterControls()}
      <Scrollbars
        className="event-scroll-list"
        style={{ maxHeight: `${scrollbarMaxHeight}` }}
      >
        <div id="wv-events">
          {isLoading || hasRequestError ? (
            // notranslate included below to prevent Google Translate extension from crashing the page
            <div className="events-loading-text notranslate">
              {hasRequestError && (<FontAwesomeIcon icon="exclamation-triangle" fixedWidth widthAuto />)}
              {errorOrLoadingText}
            </div>
          ) : renderEventList()}
        </div>
      </Scrollbars>
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
  highlightEvent: (id, dateStr) => {
    dispatch(highlightEventActionCreator(id, dateStr));
  },
  unHighlightEvent: () => {
    dispatch(unHighlightEventActionCreator());
  },
  openFilterModal: () => {
    dispatch(toggleCustomContent('events-filter', {
      headerText: 'Filter Events',
      backdrop: false,
      bodyComponent: EventFilterModalBody,
      footer: true,
      modalClassName: isMobileOnly || isTablet ? 'sidebar-modal-mobile event-filter-modal-mobile' : 'sidebar-modal event-filter-modal',
      timeout: 150,
    }));
  },
  addLayer: (id) => {
    dispatch(addLayerAction(id));
  },
  toggleVisibility: (layerIds, visible) => {
    dispatch(toggleVisibilityAction(layerIds, visible));
  },
  removeGroup: (ids) => {
    dispatch(removeGroupAction(ids));
  },
  toggleGroupVisibility: (layerIds, visible) => {
    dispatch(toggleGroupVisibilityAction(layerIds, visible));
  },
});

const mapStateToProps = (state) => {
  const {
    animation,
    config,
    embed,
    events,
    screenSize,
    layers,
  } = state;

  const {
    selected, highlighted, showAll, selectedDates, selectedCategories,
  } = events;
  const { isEmbedModeActive } = embed;

  return {
    defaultEventLayer: config.naturalEvents.defaultLayer,
    eventLayers: layers.eventLayers,
    isPlaying: animation.isPlaying,
    isMobile: screenSize.isMobileDevice,
    isEmbedModeActive,
    isAnimatingToEvent: events.isAnimatingToEvent,
    layers: layers.active.layers,
    showAll,
    showDates: !!(selectedDates.start && selectedDates.end),
    selected,
    highlighted,
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
  defaultEventLayer: PropTypes.string,
  deselectEvent: PropTypes.func,
  eventsData: PropTypes.array,
  eventLayers: PropTypes.array,
  hasRequestError: PropTypes.bool,
  height: PropTypes.number,
  highlighted: PropTypes.object,
  highlightEvent: PropTypes.func,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  layers: PropTypes.array,
  openFilterModal: PropTypes.func,
  removeGroup: PropTypes.func,
  selected: PropTypes.object,
  selectedDate: PropTypes.string,
  selectedStartDate: PropTypes.string,
  selectedEndDate: PropTypes.string,
  selectedCategories: PropTypes.array,
  selectEvent: PropTypes.func,
  showAlert: PropTypes.bool,
  showDates: PropTypes.bool,
  sources: PropTypes.array,
  toggleGroupVisibility: PropTypes.func,
  toggleVisibility: PropTypes.func,
  unHighlightEvent: PropTypes.func,
};
