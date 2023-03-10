import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Legend, Tooltip,
} from 'recharts';
import PropTypes from 'prop-types';

function ChartComponent (props) {
  const {
    liveData,
  } = props;

  const { data } = liveData;

  // Arbitrary array of colors to use
  const lineColors = ['#8884D8', '#82CA9D', 'orange', 'pink', 'green', 'red', 'yellow', 'aqua', 'maroon'];

  /**
   * Return an array of Recharts Line objects
   * @param {Object} chartData
   */
  function getLineChart(chartData) {
    const chartLineName = getLineNames(chartData);

    const chartLinesArr = chartLineName.map((id, index) => (
      <Line
        type="linear"
        key={id}
        dataKey={chartLineName[index]}
        stroke={lineColors[index]}
      />
    ));
    return chartLinesArr;
  }

  /**
   * Extracts each key from the provided object & returns the list, removing 'name' from the collection
   * @param {Object} chartData
   */
  function getLineNames(obj) {
    // Add additional fields to the chart here!!
    const linesToInclude = ['mean'];
    return Object.keys(obj[0]).filter((val) => linesToInclude.indexOf(val) > -1);
  }

  /**
   * Processes each date in the chart data, computes & returns the averages as "quick statistics"
   * @param {Object} chartData
   */
  function getQuickStatistics(data) {
    const count = data.length;
    let minTotal = 0;
    let maxTotal = 0;
    let meanTotal = 0;
    let medianTotal = 0;
    let stddevTotal = 0;

    for (let i = 0; i < data.length; i += 1) {
      meanTotal += data[i].mean;
      minTotal += data[i].min;
      maxTotal += data[i].max;
      medianTotal += data[i].median;
      stddevTotal += data[i].stddev;
    }

    return (
      <>
        <div className="charting-statistics-container">
          <div className="charting-statistics-row">
            <div className="charting-statistics-label">
              Median:
            </div>
            <div className="charting-statistics-value">
              {formatToThreeDigits(parseFloat(medianTotal) / count)}
            </div>
          </div>
          <div className="charting-statistics-row">
            <div className="charting-statistics-label">
              Mean:
            </div>
            <div className="charting-statistics-value">
              {formatToThreeDigits(meanTotal / count)}
            </div>
          </div>
          <div className="charting-statistics-row">
            <div className="charting-statistics-label">
              Min:
            </div>
            <div className="charting-statistics-value">
              {formatToThreeDigits(minTotal / count)}
            </div>
          </div>
          <div className="charting-statistics-row">
            <div className="charting-statistics-label">
              Max:
            </div>
            <div className="charting-statistics-value">
              {formatToThreeDigits(maxTotal / count)}
            </div>
          </div>
          <div className="charting-statistics-row">
            <div className="charting-statistics-label">
              Stdev:
            </div>
            <div className="charting-statistics-value">
              {formatToThreeDigits(stddevTotal / count)}
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

  function formatToThreeDigits(str) {
    return parseFloat(str).toFixed(3);
  }

  return (
    <>
      <div className="charting-chart-container">
        <div className="charting-chart-text">
          <LineChart width={600} height={300} data={data}>
            <Tooltip />
            {' '}
            <Legend />
            {getLineChart(data)}
            <XAxis dataKey="name" />
            <YAxis />
            <Legend />
          </LineChart>
        </div>
        <div className="charting-stat-text">
          <h3>Average Statistics</h3>
          <br />
          {getQuickStatistics(data)}
        </div>
      </div>
    </>
  );
}

ChartComponent.propTypes = {
  liveData: PropTypes.object,
};

export default ChartComponent;
