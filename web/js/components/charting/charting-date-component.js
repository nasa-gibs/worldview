import React from 'react';
import PropTypes from 'prop-types';
import DateSelector from '../date-selector/date-selector';

function ChartingDateComponent (props) {
  const startDate = new Date();
  const endDate = new Date();
  const minDate = new Date();
  // const onDateChange = null;
  // const maxDate = new Date();
  // const subDailyMode = false;
  // const isPlaying = false;
  const setStartDate = () => {
    console.log('setStartDate');
  };

  return (
    <div className="charting-date-container">
      <DateSelector
        date={startDate}
        idSuffix="charting-date-selector"
        onDateChange={setStartDate}
        minDate={minDate}
        maxDate={endDate}
        subDailyMode={false}
        isDisabled={false}
        isStartDate
      />
      <DateSelector
        date={startDate}
        idSuffix="charting-date-selector"
        onDateChange={setStartDate}
        minDate={minDate}
        maxDate={endDate}
        subDailyMode={false}
        isDisabled={false}
        isStartDate
      />
    </div>
  );
}

ChartingDateComponent.propTypes = {

};

export default ChartingDateComponent;
