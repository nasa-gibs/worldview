import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Legend, Tooltip,
} from 'recharts';
import PropTypes from 'prop-types';

function ChartComponent (props) {
  const {
    liveData,
  } = props;
  const { data, source } = liveData;

  // Arbitrary array of colors to use
  const lineColors = ['#A3905D', '#82CA9D', 'orange', 'pink', 'green', 'red', 'yellow', 'aqua', 'maroon'];

  function formatToThreeDigits(str) {
    return parseFloat(str).toExponential(3);
  }

  /**
   * Return an array of provided min & max values buffered by 10%
   * @param {number} min | the lowest mean value of the collected data
   * @param {number} max | the highest mean value of the collected data
   */
  function bufferYAxisMinAndMax(min, max) {
    const yAxisMin = Math.floor(min * 4) / 4;
    const yAxisMax = Math.ceil(max * 4) / 4;
    return [yAxisMin - yAxisMin * 0.1, yAxisMax + yAxisMax * 0.1];
  }

  /**
   * Process the data & determine the min & max MEAN values to establish the Y Axis Scale
   * @param {Object} axisData
   */
  function getYAxisValues(axisData) {
    let lowestMin;
    let highestMax;
    for (let i = 0; i < axisData.length; i += 1) {
      const currentMean = parseFloat(Number(axisData[i].mean).toLocaleString('fullwide', { useGrouping: false }));
      if (!Number.isNaN(currentMean)) {
        // Establish mean min & max values for chart rendering
        if (currentMean < lowestMin || lowestMin === undefined) {
          lowestMin = currentMean;
        }
        if (currentMean > highestMax || highestMax === undefined) {
          highestMax = currentMean;
        }
      }
    }
    return bufferYAxisMinAndMax(lowestMin, highestMax);
  }

  const yAxisValuesArr = getYAxisValues(data);

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
   * Processes each date in the chart data, computes & returns the averages as "quick statistics"
   * @param {Object} chartData
   */
  function getQuickStatistics(chartData) {
    const minValue = chartData.filter((el) => !Number.isNaN(parseFloat(el.min))).reduce((acc, curr) => acc + parseFloat(curr.min), 0) / chartData.filter((el) => !Number.isNaN(el.min)).length;
    const maxValue = chartData.filter((el) => !Number.isNaN(parseFloat(el.max))).reduce((acc, curr) => acc + parseFloat(curr.max), 0) / chartData.filter((el) => !Number.isNaN(el.max)).length;
    const meanValue = chartData.filter((el) => !Number.isNaN(parseFloat(el.mean))).reduce((acc, curr) => acc + parseFloat(curr.mean), 0) / chartData.filter((el) => !Number.isNaN(el.mean)).length;
    const medianValue = chartData.filter((el) => !Number.isNaN(parseFloat(el.median))).reduce((acc, curr) => acc + parseFloat(curr.median), 0) / chartData.filter((el) => !Number.isNaN(el.median)).length;
    const stddevValue = chartData.filter((el) => !Number.isNaN(parseFloat(el.stddev))).reduce((acc, curr) => acc + parseFloat(curr.stddev), 0) / chartData.filter((el) => !Number.isNaN(el.stddev)).length;
    return (
      <>
        <div className="charting-statistics-container">
          <div className="charting-statistics-row">
            <div className="charting-statistics-label">
              Median:
            </div>
            <div className="charting-statistics-value">
              {formatToThreeDigits(medianValue)}
            </div>
          </div>
          <div className="charting-statistics-row">
            <div className="charting-statistics-label">
              Mean:
            </div>
            <div className="charting-statistics-value">
              {formatToThreeDigits(meanValue)}
            </div>
          </div>
          <div className="charting-statistics-row">
            <div className="charting-statistics-label">
              Min:
            </div>
            <div className="charting-statistics-value">
              {formatToThreeDigits(minValue)}
            </div>
          </div>
          <div className="charting-statistics-row">
            <div className="charting-statistics-label">
              Max:
            </div>
            <div className="charting-statistics-value">
              {formatToThreeDigits(maxValue)}
            </div>
          </div>
          <div className="charting-statistics-row">
            <div className="charting-statistics-label">
              Stdev:
            </div>
            <div className="charting-statistics-value">
              {formatToThreeDigits(stddevValue)}
            </div>
          </div>
        </div>
        { source === 'GIBS' ? (
          <div className="charting-discalimer">
            <strong>NOTE:</strong>
            <br />
            {' '}
            Numerical analyses performed on imagery should only be used for initial basic exploratory purposes
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="charting-chart-container">
      <div className="charting-chart-text">
        <LineChart width={600} height={300} data={data}>
          <Tooltip />
          {' '}
          <Legend />
          {getLineChart(data)}
          <XAxis dataKey="name" stroke="#a6a5a6" />
          <YAxis width={75} type="number" stroke="#a6a5a6" domain={yAxisValuesArr} tickFormatter={(val) => val.toExponential(3)} />
          <Legend />
        </LineChart>
      </div>
      <div className="charting-stat-text">
        <h3>Average Statistics</h3>
        <br />
        {getQuickStatistics(data)}
      </div>
    </div>
  );
}

ChartComponent.propTypes = {
  liveData: PropTypes.object,
};

export default ChartComponent;
