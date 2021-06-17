import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import googleTagManager from 'googleTagManager';
import moment from 'moment';
import { Portal } from 'react-portal';
import Switch from '../util/switch';
import Checkbox from '../util/checkbox';
import {
  setEventsFilter as setEventsFilterAction,
} from '../../modules/natural-events/actions';
import util from '../../util/util';
import DateRangeSelector from '../date-selector/date-range-selector';

function EventFilterModalBody (props) {
  const {
    eventCategories,
    selectedCategories,
    selectedStartDate,
    selectedEndDate,
    setFilter,
    closeModal,
    showAll,
    parentId,
    isPolarProj,
  } = props;

  const [allNone, setAllNone] = useState(!!selectedCategories.length);
  const [categories, setCategories] = useState(selectedCategories);
  const [listAll, setListAll] = useState(showAll);

  const parsedStartDate = selectedStartDate && new Date(moment(selectedStartDate).valueOf());
  const parsedEndDate = selectedEndDate && new Date(moment(selectedEndDate).valueOf());
  const [dateRange, setDateRange] = useState([parsedStartDate, parsedEndDate]);
  const [startDate, endDate] = dateRange || [];

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
    setFilter(categories, start, end, listAll);
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
  const minDate = new Date('01-01-2000');
  const maxDate = new Date();

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
          <h2 className="wv-header">Disable/Enable</h2>
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
        <Checkbox
          id="map-extent-filter"
          label="Only list events in current map view"
          onCheck={() => setListAll(!listAll)}
          checked={!listAll}
        />
      )}

      <Portal node={document.querySelector(`#${parentId} .modal-footer`)}>
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
      </Portal>
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
};

const mapStateToProps = (state) => {
  const { events, proj } = state;
  const {
    selectedCategories, selectedDates, allCategories, showAll,
  } = events;

  const isPolarProj = proj.selected.crs === 'EPSG:3031' || proj.selected.crs === 'EPSG:3413';

  return {
    isPolarProj,
    eventCategories: allCategories,
    selectedCategories,
    selectedStartDate: selectedDates.start,
    selectedEndDate: selectedDates.end,
    showAll,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setFilter: (categories, startDate, endDate, showAll) => {
    dispatch(
      setEventsFilterAction(
        categories,
        startDate,
        endDate,
        showAll,
      ),
    );
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(EventFilterModalBody);
