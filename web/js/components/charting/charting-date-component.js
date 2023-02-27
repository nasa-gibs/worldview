import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DateRangeSelector from '../date-selector/date-range-selector';
import {
  changeStartDate,
  changeEndDate,
} from '../../modules/charting/actions';

function ChartingDateComponent (props) {
  const {
    onUpdateStartDate, onUpdateEndDate, timeSpanStartDate, timeSpanEndDate, date,
  } = props;

  console.log('ChartingDateComponent');
  const { selected } = date;
  const startdate = timeSpanStartDate == null ? selected : timeSpanStartDate;
  console.log(`startdate: ${startdate}`);
  const minDate = new Date('01/01/1900');
  const maxDate = new Date('12/31/2035');

  function onDateChange([newStartDate, newEndDate]) {
    if (newStartDate !== timeSpanStartDate) {
      onUpdateStartDate(newStartDate);
    }

    if (newEndDate !== timeSpanEndDate) {
      onUpdateEndDate(newEndDate);
    }
  }

  return (
    <div className="charting-date-container">
      {/* From/To Date/Time Selection */}
      {/* Copied from animation widget */}
      <DateRangeSelector
        idSuffix="charting-date-picker"
        startDate={startdate}
        endDate={timeSpanEndDate}
        setDateRange={onDateChange}
        minDate={minDate}
        maxDate={maxDate}
        subDailyMode={false}
        isDisabled={false}
      />
    </div>
  );
}
function mapStateToProps(state) {
  const {
    date, charting,
  } = state;
  const { timeSpanStartDate, timeSpanEndDate } = charting;

  return { date, timeSpanStartDate, timeSpanEndDate };
}

const mapDispatchToProps = (dispatch) => ({
  // These functions are passed as props to date-selector
  onUpdateStartDate(date) {
    dispatch(changeStartDate(date));
  },
  onUpdateEndDate(date) {
    dispatch(changeEndDate(date));
  },
});

ChartingDateComponent.propTypes = {
  timeSpanStartDate: PropTypes.object,
  timeSpanEndDate: PropTypes.object,
  onUpdateStartDate: PropTypes.func,
  onUpdateEndDate: PropTypes.func,
  date: PropTypes.object,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChartingDateComponent);
