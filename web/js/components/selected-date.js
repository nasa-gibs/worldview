import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import getSelectedDate from '../modules/date/selectors';

// A simple component to re-use anywhere we want to display the selected date
const SelectedDate = ({ selectedDate }) => (<>{selectedDate}</>);

SelectedDate.propTypes = {
  selectedDate: PropTypes.string,
};

const mapStateToProps = (state) => {
  const selectedDate = getSelectedDate(state);
  return {
    selectedDate: moment.utc(selectedDate).format('YYYY MMM DD'),
  };
};

export default connect(mapStateToProps)(SelectedDate);
