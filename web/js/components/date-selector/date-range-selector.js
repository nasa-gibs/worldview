import React from 'react';
import PropTypes from 'prop-types';
import DateSelector from './date-selector';

export default function DateRangeSelector (props) {
  const {
    startDate, endDate, setDateRange, minDate, maxDate, subDailyMode, idSuffix,
  } = props;

  const setStartDate = (newStart, id) => {
    setDateRange([newStart, endDate]);
  };
  const setEndDate = (newEnd, id) => {
    setDateRange([startDate, newEnd]);
  };
  return (
    <div className="wv-date-range-selector">
      <DateSelector
        idSuffix={idSuffix}
        date={startDate}
        onDateChange={setStartDate}
        minDate={minDate}
        maxDate={maxDate}
        subDailyMode={subDailyMode}
        isStartDate
      />
      <div className="thru-label">to</div>
      <DateSelector
        idSuffix={idSuffix}
        date={endDate}
        onDateChange={setEndDate}
        maxDate={maxDate}
        minDate={startDate}
        subDailyMode={subDailyMode}
        isEndDate
      />
    </div>
  );
}

DateRangeSelector.propTypes = {
  idSuffix: PropTypes.string,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
  setDateRange: PropTypes.func,
  minDate: PropTypes.object,
  maxDate: PropTypes.object,
  subDailyMode: PropTypes.bool,
};
