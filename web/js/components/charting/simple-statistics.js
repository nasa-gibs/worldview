import React from 'react';
import PropTypes from 'prop-types';

function SimpleStatistics(props) {
  const { data } = props;

  const {
    median, mean, max, min, stdev, timestamp, type, endTimestamp,
  } = data;

  let dateStr;
  if (type === 'date') {
    dateStr = `Date: ${timestamp}`;
  } else {
    dateStr = `Date range: ${timestamp} - ${endTimestamp}`;
  }

  function formatToThreeDigits(str) {
    return parseFloat(str).toFixed(3);
  }

  return (
    <>
      <div className="charting-statistics-container">
        <div className="charting-statistics-row">
          <div className="charting-statistics-label">
            {dateStr}
          </div>
        </div>
        <div className="charting-statistics-row">
          <div className="charting-statistics-label">
            Median:
          </div>
          <div className="charting-statistics-value">
            {formatToThreeDigits(median)}
          </div>
        </div>
        <div className="charting-statistics-row">
          <div className="charting-statistics-label">
            Mean:
          </div>
          <div className="charting-statistics-value">
            {formatToThreeDigits(mean)}
          </div>
        </div>
        <div className="charting-statistics-row">
          <div className="charting-statistics-label">
            Min:
          </div>
          <div className="charting-statistics-value">
            {formatToThreeDigits(min)}
          </div>
        </div>
        <div className="charting-statistics-row">
          <div className="charting-statistics-label">
            Max:
          </div>
          <div className="charting-statistics-value">
            {formatToThreeDigits(max)}
          </div>
        </div>
        <div className="charting-statistics-row">
          <div className="charting-statistics-label">
            Stdev:
          </div>
          <div className="charting-statistics-value">
            {formatToThreeDigits(stdev)}
          </div>
        </div>
      </div>
      <div className="charting-discalimer">
        <strong>NOTE:</strong>
        {' '}
        Numerical analyses performed on imagery should only be used for initial basic exploratory purposes
      </div>
    </>
  );
}

SimpleStatistics.propTypes = {
  data: PropTypes.object,
};

export default SimpleStatistics;

