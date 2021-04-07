import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import Switch from '../util/switch';
import Arrow from '../util/arrow';
import {
  setEventsFilter as setEventsFilterAction,
} from '../../modules/natural-events/actions';

function EventsFilter (props) {
  const {
    eventCategories,
    selectedCategories,
    selectedYear,
    setFilter,
    closeModal,
  } = props;

  const [year, setYear] = useState(selectedYear);
  const onYearChange = (e) => {
    setYear(e.target.value);
  };
  const onYearClick = (increment) => {
    setYear(year + increment);
  };

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
    setFilter(categories, year);
    closeModal();
  };

  return (
    <div>

      <div className="category-toggles">
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

      <div className="year-selector">
        <Arrow
          direction="up"
          onClick={() => onYearClick(1)}
          type="year"
        />
        <input
          type="text"
          size={4}
          maxLength={4}
          // className={inputClassName}
          id="year-selector-input"
          value={year}
          onChange={onYearChange}
          // style={fontSizeStyle}
          onBlur={onYearChange}
          // onFocus={this.handleFocus}
        />
        <Arrow
          direction="down"
          onClick={() => onYearClick(-1)}
          type="year"
        />
      </div>

      <Button onClick={applyFilter}>
        Apply
      </Button>
      <Button onClick={closeModal}>
        Cancel
      </Button>
    </div>
  );
}

EventsFilter.propTypes = {
  closeModal: PropTypes.func,
  eventCategories: PropTypes.array,
  selectedCategories: PropTypes.array,
  selectedYear: PropTypes.number,
  setFilter: PropTypes.func,
};

const mapStateToProps = (state) => {
  const { events, requestedEventCategories } = state;
  const { selectedCategories, selectedYear } = events;
  return {
    eventCategories: requestedEventCategories.response || [],
    selectedCategories,
    selectedYear,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setFilter: (categories, year) => {
    dispatch(setEventsFilterAction(categories, year));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(EventsFilter);
