import React, { useState } from 'react';
import { Portal } from 'react-portal';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
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
    const isActive = selectedCategories.includes(categoryTitle);
    let newCategories;
    if (isActive) {
      newCategories = categories.filter((category) => category !== categoryTitle);
    } else {
      newCategories = [categoryTitle].concat(categories);
    }
    setCategories(newCategories);
  };

  const applyFilter = () => {
    const [startDate, endDate] = dateRange;
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

  const portalNode = document.querySelector('.modal-footer');

  return (
    <div className="events-filter">

      <DateRangePicker
        onChange={setDateRange}
        value={dateRange}
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
              // color={}
              label={title}
              active={isActive}
              tooltip={description}
              toggle={() => toggleCategory(title)}
            />
          );
        })}
      </div>

      <Portal node={portalNode}>
        {/* <div className="modal-footer"> */}
        <Button color="primary" onClick={applyFilter}>
          Apply
        </Button>
        <Button color="secondary" onClick={closeModal}>
          Cancel
        </Button>
        {/* </div> */}
      </Portal>

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
