import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, ModalFooter } from 'reactstrap';
import googleTagManager from 'googleTagManager';
// import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import moment from 'moment';
import Switch from '../util/switch';
import Checkbox from '../util/checkbox';
import {
  setEventsFilter as setEventsFilterAction,
  toggleListAll as toggleListAllAction,
} from '../../modules/natural-events/actions';
import util from '../../util/util';
import DateSelector from '../date-selector/date-selector';

function EventsFilter (props) {
  const {
    eventCategories,
    selectedCategories,
    selectedStartDate,
    selectedEndDate,
    setFilter,
    closeModal,
    toggleListAll,
    showAll,
  } = props;

  const [allNone, setAllNone] = useState(!!selectedCategories.length);
  const [categories, setCategories] = useState(selectedCategories);

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

  const toggleListAllCheckbox = () => {
    toggleListAll();
    if (showAll) {
      googleTagManager.pushEvent({
        event: 'natural_events_current_view_only',
      });
    } else {
      googleTagManager.pushEvent({
        event: 'natural_events_show_all',
      });
    }
  };

  const applyFilter = () => {
    const start = startDate && util.toISOStringDate(startDate);
    const end = endDate && util.toISOStringDate(endDate);
    setFilter(categories, start, end);
    closeModal();
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
  const setStartDate = (newStart, id) => {
    setDateRange([newStart, endDate]);
  };
  const setEndDate = (newEnd, id) => {
    setDateRange([startDate, newEnd]);
  };

  return (
    <div className="events-filter">

      {/* <DateRangePicker
        onChange={setDateRange}
        value={dateRange}
        minDate={new Date('01-01-2000')}
        maxDate={new Date()}
        dayPlaceholder="DD"
        monthPlaceholder="MM"
        yearPlaceholder="YYYY"
        format="y-MM-dd"
        rangeDivider=" to "
        showDoubleView
        openCalendarOnFocus={false}
        closeCalendar={false}
      /> */}

      <div className="event-filter-date-range">
        <DateSelector
          id="event-filter-start"
          idSuffix="event-filter-start"
          date={startDate}
          onDateChange={setStartDate}
          minDate={minDate}
          maxDate={maxDate}
          subDailyMode={false}
        />
        <div className="thru-label">to</div>
        <DateSelector
          id="event-filter-end"
          idSuffix="event-filter-end"
          date={endDate}
          onDateChange={setEndDate}
          maxDate={maxDate}
          minDate={startDate}
          subDailyMode={false}
        />
      </div>

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

      <Checkbox
        id="events-footer-checkbox"
        label="Only list events in current map view"
        onCheck={toggleListAllCheckbox}
        checked={!showAll}
      />

      <ModalFooter>
        <Button
          id="filter-apply-btn"
          color="primary"
          onClick={applyFilter}
          disabled={disableApply}
          title={getDisableApplyMsg()}
        >
          Apply
        </Button>
        <Button color="secondary" onClick={closeModal}>
          Cancel
        </Button>
      </ModalFooter>

    </div>
  );
}

EventsFilter.propTypes = {
  closeModal: PropTypes.func,
  eventCategories: PropTypes.array,
  selectedCategories: PropTypes.array,
  selectedStartDate: PropTypes.string,
  selectedEndDate: PropTypes.string,
  setFilter: PropTypes.func,
  showAll: PropTypes.bool,
  toggleListAll: PropTypes.func,
};

const mapStateToProps = (state) => {
  const { events } = state;
  const {
    selectedCategories, selectedDates, allCategories, showAll,
  } = events;
  return {
    eventCategories: allCategories,
    selectedCategories,
    selectedStartDate: selectedDates.start,
    selectedEndDate: selectedDates.end,
    showAll,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setFilter: (categories, startDate, endDate) => {
    dispatch(
      setEventsFilterAction(
        categories,
        startDate,
        endDate,
      ),
    );
    dispatch(toggleListAllAction());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(EventsFilter);
