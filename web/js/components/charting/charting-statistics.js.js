import React from 'react';
import PropTypes from 'prop-types';

function ChartingStatistics(props) {
  const {
    simpleStatsData,
  } = props;

  const {
    median, mean, max, stdev,
  } = JSON.parse(simpleStatsData);

  return (
    <div className="charting-statistics-container">
      <div className="charting-statistics-text">
        Median:
        {' '}
        {median}
        <br />
        Mean:
        {' '}
        {mean}
        <br />
        Max:
        {' '}
        {max}
        <br />
        Stdev:
        {' '}
        {stdev}
        <br />
      </div>
    </div>
  );
}

ChartingStatistics.propTypes = {
  simpleStatsData: PropTypes.string,
};

export default ChartingStatistics;

