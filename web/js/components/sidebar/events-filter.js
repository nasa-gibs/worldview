import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, ModalFooter } from 'reactstrap';
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import Switch from '../util/switch';
import {
  setEventsFilter as setEventsFilterAction,
} from '../../modules/natural-events/actions';

function EventsFilter (props) {
  const {
    eventCategories,
    selectedCategories,
    selectedStartDate,
    selectedEndDate,
    setFilter,
    closeModal,
  } = props;

  const [dateRange, setDateRange] = useState([selectedStartDate, selectedEndDate]);
  const [allNone, setAllNone] = useState(!!selectedCategories.length);
  const [categories, setCategories] = useState(selectedCategories);

  const toggleCategory = (categoryTitle) => {
    const isActive = categories.includes(categoryTitle);
    let newCategories;
    if (isActive) {
      newCategories = categories.filter((category) => category !== categoryTitle);
    } else {
      newCategories = [categoryTitle].concat(categories);
    }
    setCategories(newCategories);
  };

  const applyFilter = () => {
    setFilter(categories, startDate, endDate);
    closeModal();
  };

  const selectAllNone = () => {
    if (allNone) {
      setCategories([]);
    } else {
      setCategories(eventCategories.map(({ title }) => title));
    }
    setAllNone(!allNone);
  };

  const [startDate, endDate] = dateRange || [];
  const disableApply = !startDate || !endDate || !categories.length;
  const getDisableApplyMsg = () => {
    let msg = '';
    if (!startDate || !endDate) {
      msg += 'Date range must be set.';
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
        minDate={new Date('01-01-1975')}
        maxDate={new Date()}
        required
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
          const isActive = categories.includes(title);
          return (
            <Switch
              id={switchId}
              key={switchId}
              label={title}
              active={isActive}
              tooltip={description}
              toggle={() => toggleCategory(title)}
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
  selectedStartDate: PropTypes.object,
  selectedEndDate: PropTypes.object,
  setFilter: PropTypes.func,
};

const mapStateToProps = (state) => {
  const { events, requestedEventCategories } = state;
  const { selectedCategories, selectedStartDate, selectedEndDate } = events;
  return {
    eventCategories: requestedEventCategories.response || [],
    selectedCategories,
    selectedStartDate,
    selectedEndDate,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setFilter: (categories, startDate, endDate) => {
    dispatch(setEventsFilterAction(categories, startDate, endDate));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(EventsFilter);
