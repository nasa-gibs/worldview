import React from 'react';
import PropTypes from 'prop-types';

function ChartingStatistics(props) {
  const {
    simpleStatsData,
  } = props;

  const {
    median, mean, max, stdev,
  } = simpleStatsData;


  function formatToThreeDigits(str) {
    return parseFloat(str).toFixed(3);
  }

  return (
    <div className="charting-statistics-container">
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
  );
}

ChartingStatistics.propTypes = {
  simpleStatsData: PropTypes.object,
};

export default ChartingStatistics;

