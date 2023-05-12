import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, UncontrolledTooltip } from 'reactstrap';
import googleTagManager from 'googleTagManager';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createPortal } from 'react-dom';
import Switch from '../util/switch';
import Checkbox from '../util/checkbox';
import {
  setEventsFilter as setEventsFilterAction,
} from '../../modules/natural-events/actions';
import util from '../../util/util';
import DateRangeSelector from '../date-selector/date-range-selector';
import { CRS } from '../../modules/map/constants';

function EventFilterModalBody (props) {
  const {
    eventCategories,
    selectedCategories,
    selectedStartDate,
    selectedEndDate,
    setFilter,
    closeModal,
    showAll,
    showAllTracks,
    parentId,
    isPolarProj,
    isMobile,
  } = props;

  const [allNone, setAllNone] = useState(!!selectedCategories.length);
  const [categories, setCategories] = useState(selectedCategories);
  const [listAll, setListAll] = useState(showAll);
  const [showAllTracksData, toggleShowAllTracks] = useState(showAllTracks);

  const parsedStartDate = selectedStartDate && new Date(moment(selectedStartDate).valueOf());
  const parsedEndDate = selectedEndDate && new Date(moment(selectedEndDate).valueOf());
  const [dateRange, setDateRange] = useState([parsedStartDate, parsedEndDate]);
  const [startDate, endDate] = dateRange || [];
  const [modalFooterNode, setModalFooterNode] = useState(null);

  useEffect(() => {
    setModalFooterNode(document.querySelector(`#${parentId} .modal-footer`));
  }, []);

  const toggleCategory = (category) => {
    const isActive = categories.some(({ id }) => id === category.id);
    let newCategories;
    if (isActive) {
      newCategories = categories.filter(({ id }) => id !== category.id);
    } else {
      newCategories = [category].concat(categories);
    }
    setCategories(newCategories);
  };

  const applyFilter = () => {
    const start = startDate && util.toISOStringDate(startDate);
    const end = endDate && util.toISOStringDate(endDate);
    closeModal();
    setFilter(categories, start, end, listAll, showAllTracksData);
    if (showAll !== listAll) {
      const event = listAll ? 'natural_events_show_all' : 'natural_events_current_view_only';
      googleTagManager.pushEvent({ event });
    }
  };

  const selectAllNone = () => {
    if (allNone) {
      setCategories([]);
    } else {
      setCategories(eventCategories);
    }
    setAllNone(!allNone);
  };
  const disableApply = !categories.length || !!(!startDate && endDate) || !!(!endDate && startDate);
  const getDisableApplyMsg = () => {
    let msg = '';
    if (!startDate || !endDate) {
      msg += 'Must have both start and end date (or neither).';
    }
    if (!categories.length) {
      msg += ' At least one category must be selected';
    }
    return msg;
  };
  const minDate = new Date('2000-01-01');
  const maxDate = util.now();

  const mobileStyle = isMobile ? {
    fontSize: '14px',
  } : null;



  return (
    <div className="events-filter">
      <DateRangeSelector
        idSuffix="event-filter"
        startDate={startDate}
        endDate={endDate}
        setDateRange={setDateRange}
        minDate={minDate}
        maxDate={maxDate}
        subDailyMode={false}
      />

      <div className="category-toggles">
        <div className="classification-switch-header">
          <h2 className="wv-header" style={mobileStyle}>Disable/Enable</h2>
          <Switch
            id="header-disable"
            label="All"
            containerClassAddition="header"
            active={allNone}
            toggle={selectAllNone}
          />
        </div>

        {eventCategories.map((category) => {
          const { id, title, description } = category;
          const switchId = `${id}-switch`;
          const isActive = categories.some((c) => c.title === title);
          return (
            <div className="category-switch-row" key={switchId}>
              <Switch
                id={switchId}
                label={title}
                active={isActive}
                tooltip={description}
                toggle={() => toggleCategory(category)}
              />
            </div>
          );
        })}
      </div>

      {!isPolarProj && (
        <>
          <Checkbox
            id="map-extent-filter"
            label="Only list events in current map view"
            onCheck={() => setListAll(!listAll)}
            checked={!listAll}
          />
          <FontAwesomeIcon id="bbox-limit-info" icon="info-circle" />
          <UncontrolledTooltip
            id="center-align-tooltip"
            placement="right"
            target="bbox-limit-info"
          >
            If checked, limits event results to those located within the current map view.
            If you move the map, you will need to open the filter and click &quot;Apply&quot; again
            to update the results.
          </UncontrolledTooltip>
        </>
      )}

      <Checkbox
        id="show-all-tracks-filter"
        label="Show tracks for all events"
        onCheck={() => toggleShowAllTracks(!showAllTracksData)}
        checked={showAllTracksData}
      />
      <FontAwesomeIcon id="bbox-show-all-tracks" icon="info-circle" />
      <UncontrolledTooltip
        id="center-align-tooltip"
        placement="right"
        target="bbox-show-all-tracks"
      >
        If checked, shows tracks for all of the events listed in the sidebar. If unchecked, tracks will only
        show for a selected event.
      </UncontrolledTooltip>

      {modalFooterNode && createPortal(
        <>
          <Button
            id="filter-apply-btn"
            color="primary"
            onClick={applyFilter}
            disabled={disableApply}
            title={getDisableApplyMsg()}
          >
            Apply
          </Button>
          <Button
            id="filter-cancel-btn"
            color="secondary"
            onClick={closeModal}
          >
            Cancel
          </Button>
        </>,
        modalFooterNode,
      )}
    </div>
  );
}

EventFilterModalBody.propTypes = {
  closeModal: PropTypes.func,
  eventCategories: PropTypes.array,
  isPolarProj: PropTypes.bool,
  parentId: PropTypes.string,
  selectedCategories: PropTypes.array,
  selectedStartDate: PropTypes.string,
  selectedEndDate: PropTypes.string,
  setFilter: PropTypes.func,
  showAll: PropTypes.bool,
  showAllTracks: PropTypes.bool,
  isMobile: PropTypes.bool,
};

const mapStateToProps = (state) => {
  const {
    events, proj, config, screenSize,
  } = state;
  const {
    selectedCategories, selectedDates, showAll, showAllTracks,
  } = events;

  const isPolarProj = proj.selected.crs === CRS.ANTARCTIC || proj.selected.crs === CRS.ARCTIC;

  return {
    isPolarProj,
    eventCategories: config.naturalEvents.categories,
    selectedCategories,
    selectedStartDate: selectedDates.start,
    selectedEndDate: selectedDates.end,
    showAll,
    showAllTracks,
    isMobile: screenSize.isMobileDevice,
    screenHeight: screenSize.screenHeight,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setFilter: (categories, startDate, endDate, showAll, showAllTracks) => {
    dispatch(
      setEventsFilterAction(
        categories,
        startDate,
        endDate,
        showAll,
        showAllTracks,
      ),
    );
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(EventFilterModalBody);
