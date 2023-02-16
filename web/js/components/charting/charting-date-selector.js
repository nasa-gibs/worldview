import React from 'react';
import PropTypes from 'prop-types';
import DateSelector from '../date-selector/date-selector';
// import DateChangeArrows from '../timeline/timeline-controls/date-change-arrows';

function ChartingDateSelector (props) {
  // const {
  //   startDate, minDate, maxDate, subDailyMode,
  // } = props;
  const startDate = new Date();
  const minDate = new Date();
  const maxDate = new Date();
  const subDailyMode = false;

  console.log(`startDate: ${startDate}`);
  console.log(`minDate: ${minDate}`);
  console.log(`maxDate: ${maxDate}`);
  console.log(`subDailyMode: ${subDailyMode}`);
  function onDateChange() {
    console.log('changed');
  }
  return (
    <div id="date-selector-main">
      <DateSelector
        idSuffix="charting"
        date={startDate}
        onDateChange={onDateChange}
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

export default ChartingDateSelector;
