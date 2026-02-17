import React from 'react';
import PropTypes from 'prop-types';
import DateSelector from './date-selector';

export default function DateRangeSelector (props) {
  const {
    startDate, endDate, setDateRange, minDate, maxDate, subDailyMode, idSuffix, isDisabled,
  } = props;

  const setStartDate = (newStart) => {
    setDateRange([newStart, endDate]);
  };
  const setEndDate = (newEnd) => {
    setDateRange([startDate, newEnd]);
  };
  const className = isDisabled
    ? 'wv-date-range-selector disabled'
    : 'wv-date-range-selector';

  return (
    <div className={className}>
      <DateSelector
        date={startDate}
        idSuffix={idSuffix}
        onDateChange={setStartDate}
        minDate={minDate}
        maxDate={endDate}
        subDailyMode={subDailyMode}
        isDisabled={isDisabled}
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
        isDisabled={isDisabled}
        isEndDate
      />
    </div>
  );
}

DateRangeSelector.propTypes = {
  idSuffix: PropTypes.string,
  isDisabled: PropTypes.bool,
  startDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  endDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  setDateRange: PropTypes.func,
  minDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  maxDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  subDailyMode: PropTypes.bool,
};
