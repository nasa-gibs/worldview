import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// import DateSelector from '../date-selector/date-selector';
import DateRangeSelector from '../date-selector/date-range-selector';
import {
  changeStartDate,
  changeEndDate,
} from '../../modules/charting/actions';

function ChartingDateComponent (props) {
  const {
    onUpdateStartDate, onUpdateEndDate, timeSpanStartdate, timeSpanEndDate,
  } = props;
  const minDate = new Date();
  const maxDate = new Date();

  function onDateChange([newStartDate, newEndDate]) {
    console.log(`timeSpanStartdate: ${timeSpanStartdate}`);
    console.log(`newStartDate: ${newStartDate}`);
    console.log(`timeSpanEndDate: ${timeSpanEndDate}`);
    console.log(`newEndDate: ${newEndDate}`);

    if (newStartDate !== timeSpanStartdate) {
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
        startDate={timeSpanStartdate}
        endDate={timeSpanEndDate}
        // setDateRange={this.onDateChange} in animation widget (class component)
        // setDateRange={onDateChange}
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
  const { timeSpanStartdate, timeSpanEndDate } = charting;

  return { date, timeSpanStartdate, timeSpanEndDate };
}

const mapDispatchToProps = (dispatch) => ({
  onUpdateStartDate(date) {
    dispatch(changeStartDate(date));
  },
  onUpdateEndDate(date) {
    dispatch(changeEndDate(date));
  },
});

ChartingDateComponent.propTypes = {
  timeSpanStartdate: PropTypes.object,
  timeSpanEndDate: PropTypes.object,
  onUpdateStartDate: PropTypes.func,
  onUpdateEndDate: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChartingDateComponent);
