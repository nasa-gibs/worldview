import React from 'react';
// import PropTypes from 'prop-types';
import ChartingDateSelector from './charting-date-selector';

function ChartingDateComponent (props) {
  return (
    <div className="charting-date-container">
      <ChartingDateSelector />
      <ChartingDateSelector />
    </div>
  );
}

export default ChartingDateComponent;
