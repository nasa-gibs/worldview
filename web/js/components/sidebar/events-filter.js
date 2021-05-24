import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, ModalFooter } from 'reactstrap';
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import moment from 'moment';
import Switch from '../util/switch';
import {
  setEventsFilter as setEventsFilterAction,
} from '../../modules/natural-events/actions';
import util from '../../util/util';

function EventsFilter (props) {
  const {
    eventCategories,
    selectedCategories,
    selectedStartDate,
    selectedEndDate,
    setFilter,
    closeModal,
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

  return (
    <div className="events-filter">

      <DateRangePicker
        onChange={setDateRange}
        value={dateRange}
        minDate={new Date('01-01-2000')}
        maxDate={new Date()}
        rangeDivider=" to "
        format="y-MM-dd"
        disableCalendar
      />

      <div className="category-toggles">
        <Switch
          id="select-all-none"
          label="Select/Deselect All"
          active={allNone}
          toggle={selectAllNone}
        />
        {eventCategories.map((category) => {
          const { id, title, description } = category;
          const switchId = `${id}-switch`;
          const isActive = categories.some((c) => c.title === title);
          return (
            <Switch
              id={switchId}
              key={switchId}
              label={title}
              active={isActive}
              tooltip={description}
              toggle={() => toggleCategory(category)}
            />
          );
        })}
      </div>

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
};

const mapStateToProps = (state) => {
  const { events } = state;
  const {
    selectedCategories, selectedDates, allCategories,
  } = events;
  return {
    eventCategories: allCategories,
    selectedCategories,
    selectedStartDate: selectedDates.start,
    selectedEndDate: selectedDates.end,
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
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(EventsFilter);
