import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DateRangeSelector from '../date-selector/date-range-selector';
import {
  changeChartingStartDate,
  changeChartingEndDate,
} from '../../modules/charting/actions';

function ChartingDateSelector (props) {
  const {
    onUpdateStartDate, onUpdateEndDate, timeSpanStartDate, timeSpanEndDate, date, layerStartDate, layerEndDate,
  } = props;
  console.log(`layerStartDate: ${layerStartDate}`);
  console.log(`layerEndDate: ${layerEndDate}`);

  const { selected, selectedB } = date;
  const startdate = timeSpanStartDate == null ? selected : timeSpanStartDate;
  const endDate = timeSpanEndDate == null ? selectedB : timeSpanEndDate;
  const minDate = new Date('01/01/1900');
  const maxDate = new Date('01/01/1910');

  // Confirm start & end dates are within the min & max dates
  // Adjust if necessary
  if (startdate < minDate) {
    console.log(`startDate (${startdate} is less than minDate (${minDate}))`);
  }
  if (startdate > maxDate) {
    console.log(`startDate (${startdate} is later than maxDate (${maxDate}))`);
  }
  if (endDate < minDate) {
    console.log(`endDate (${endDate} is less than minDate (${minDate}))`);
  }
  if (endDate > maxDate) {
    console.log(`endDate (${endDate} is later than maxDate (${maxDate}))`);
  }



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
      <DateRangeSelector
        idSuffix="charting-date-picker"
        startDate={startdate}
        endDate={endDate}
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
  onUpdateStartDate(date) {
    dispatch(changeChartingStartDate(date));
  },
  onUpdateEndDate(date) {
    dispatch(changeChartingEndDate(date));
  },
});

ChartingDateSelector.propTypes = {
  timeSpanStartDate: PropTypes.object,
  timeSpanEndDate: PropTypes.object,
  layerEndDate: PropTypes.string,
  layerStartDate: PropTypes.string,
  onUpdateStartDate: PropTypes.func,
  onUpdateEndDate: PropTypes.func,
  date: PropTypes.object,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChartingDateSelector);
