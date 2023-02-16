import React from 'react';
import PropTypes from 'prop-types';
import DateSelector from '../date-selector/date-selector';
// import DateChangeArrows from '../timeline/timeline-controls/date-change-arrows';

function ChartingDateSelector (props) {
  const {
    startDate, minDate, maxDate, subDailyMode,
  } = props;
  return (
    <div id="date-selector-main">
      <DateSelector
        idSuffix="charting"
        date={startDate}
        // onDateChange={this.onDateChange}
        minDate={minDate}
        maxDate={maxDate}
        subDailyMode={subDailyMode}
        fontSize={24}
      />
    </div>
  );
}

ChartingDateSelector.propTypes = {
  startDate: PropTypes.object,
  minDate: PropTypes.object,
  maxDate: PropTypes.object,
  subDailyMode: PropTypes.bool,
};
