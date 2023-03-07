import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DateRangeSelector from '../date-selector/date-range-selector';
import {
  changeChartingStartDate,
  changeChartingEndDate,
} from '../../modules/charting/actions';
// import { offsetLineStringStyle } from '../../modules/vector-styles/util';

function ChartingDateSelector (props) {
  const {
    onUpdateStartDate, onUpdateEndDate, timeSpanStartDate, timeSpanEndDate, date, layerStartDate, layerEndDate,
  } = props;
  console.log(`layerStartDate: ${layerStartDate}`);
  console.log(`layerEndDate: ${layerEndDate}`);

  const { selected, selectedB } = date;
  const startdate = timeSpanStartDate == null ? selected : timeSpanStartDate;
  const endDate = timeSpanEndDate == null ? selectedB : timeSpanEndDate;

  // Confirm start & end dates are within the min & max dates
  const validStartDate = startdate < layerStartDate ? layerStartDate : startdate;
  const validEndDate = endDate > layerEndDate ? layerEndDate : endDate;

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
        startDate={validStartDate}
        endDate={validEndDate}
        setDateRange={onDateChange}
        minDate={layerStartDate}
        maxDate={layerEndDate}
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
  layerEndDate: PropTypes.object,
  layerStartDate: PropTypes.object,
  onUpdateStartDate: PropTypes.func,
  onUpdateEndDate: PropTypes.func,
  date: PropTypes.object,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChartingDateSelector);
