import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment';

// A common component to re-use anywhere we want to display the selected date
function SelectedDate({ selectedDate }) {
  return (
    <>{selectedDate}</>
  );
}

SelectedDate.propTypes = {
  selectedDate: PropTypes.string,
};

const mapStateToProps = ({ date }) => ({
  selectedDate: moment.utc(date.selected).format('YYYY MMM DD'),
});

export default connect(mapStateToProps)(SelectedDate);
