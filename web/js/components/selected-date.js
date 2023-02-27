import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { getSelectedDate } from '../modules/date/selectors';
import { formatDisplayDate } from '../modules/date/util';

// A simple component to re-use anywhere we want to display the selected date
function SelectedDate({ selectedDate }) {
  return <>{selectedDate}</>;
}

SelectedDate.propTypes = {
  selectedDate: PropTypes.string,
};

const mapStateToProps = (state) => {
  const selectedDate = getSelectedDate(state);
  return {
    selectedDate: formatDisplayDate(selectedDate),
  };
};

export default connect(mapStateToProps)(SelectedDate);
