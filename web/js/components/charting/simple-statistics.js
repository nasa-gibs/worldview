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
    if (parseFloat(str).toFixed(3).split('.')[0].length > 4) {
      return Number(parseFloat(str).toFixed(3)).toPrecision(3);
    }
    return parseFloat(str).toFixed(3);
  }

  return (
    <>
      <div className="charting-statistics-container charting-simple">
        <div className="charting-statistics-row">
          <div className="charting-statistics-label">
            <b>
              {dateStr}
            </b>
          </div>
        </div>
        <div className="charting-statistics-row">
          <span className="charting-statistics-label">
            Median:
          </span>
          <span className="charting-statistics-value">
            {formatToThreeDigits(median)}
          </span>
        </div>
        <div className="charting-statistics-row">
          <span className="charting-statistics-label">
            Mean:
          </span>
          <span className="charting-statistics-value">
            {formatToThreeDigits(mean)}
          </span>
        </div>
        <div className="charting-statistics-row">
          <span className="charting-statistics-label">
            Min:
          </span>
          <span className="charting-statistics-value">
            {formatToThreeDigits(min)}
          </span>
        </div>
        <div className="charting-statistics-row">
          <span className="charting-statistics-label">
            Max:
          </span>
          <span className="charting-statistics-value">
            {formatToThreeDigits(max)}
          </span>
        </div>
        <div className="charting-statistics-row">
          <span className="charting-statistics-label">
            Stdev:
          </span>
          <span className="charting-statistics-value">
            {formatToThreeDigits(stdev)}
          </span>
        </div>
      </div>
      <div className="charting-disclaimer">
        <strong>Note:</strong>
        <br />
        {' '}
        Numerical analyses performed on imagery should
        only be used for initial basic exploratory purposes.
      </div>
    </>
  );
}

SimpleStatistics.propTypes = {
  data: PropTypes.object,
};

export default SimpleStatistics;

