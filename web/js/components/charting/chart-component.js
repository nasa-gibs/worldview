import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Legend, Tooltip,
} from 'recharts';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function ChartComponent (props) {
  const {
    liveData,
  } = props;

  const {
    data,
    unit,
    startDate,
    endDate,
    numRangeDays,
    isTruncated,
    title,
    STEP_NUM,
  } = liveData;

  // Arbitrary array of colors to use
  const lineColors = ['#A3905D', '#82CA9D', 'orange', 'pink', 'green', 'red', 'yellow', 'aqua', 'maroon'];
  const formattedUnit = unit ? ` (${unit})` : '';

  function formatToThreeDigits(str) {
    return parseFloat(str).toFixed(3);
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
      // Establish mean min & max values for chart rendering
      if (axisData[i].mean < lowestMin || lowestMin === undefined) {
        lowestMin = axisData[i].mean;
      }
      if (axisData[i].mean > highestMax || highestMax === undefined) {
        highestMax = axisData[i].mean;
      }
    }

    return bufferYAxisMinAndMax(lowestMin, highestMax);
  }

  function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label" style={{ color: 'gray' }}>
            {label}
          </p>
          <p className="label" style={{ color: '#000' }}>
            <span className="custom-data-rect" style={{ backgroundColor: payload[0].color }} />
            {`${payload[0].name}${formattedUnit}: `}
            <b>
              {payload[0].value}
            </b>
          </p>
        </div>
      );
    }

    return null;
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
    const count = chartData.length;
    let minTotal = 0;
    let maxTotal = 0;
    let meanTotal = 0;
    let medianTotal = 0;
    let stddevTotal = 0;

    for (let i = 0; i < chartData.length; i += 1) {
      meanTotal += chartData[i].mean;
      minTotal += chartData[i].min;
      maxTotal += chartData[i].max;
      medianTotal += chartData[i].median;
      stddevTotal += chartData[i].stddev;
    }

    return (
      <>
        <div className="charting-statistics-container">
          <div className="charting-statistics-row">
            <span className="charting-statistics-label">
              Median:
            </span>
            <span className="charting-statistics-value">
              {formatToThreeDigits(medianTotal / count)}
            </span>
          </div>
          <div className="charting-statistics-row">
            <span className="charting-statistics-label">
              Mean:
            </span>
            <span className="charting-statistics-value">
              {formatToThreeDigits(meanTotal / count)}
            </span>
          </div>
          <div className="charting-statistics-row">
            <span className="charting-statistics-label">
              Min:
            </span>
            <span className="charting-statistics-value">
              {formatToThreeDigits(minTotal / count)}
            </span>
          </div>
          <div className="charting-statistics-row">
            <span className="charting-statistics-label">
              Max:
            </span>
            <span className="charting-statistics-value">
              {formatToThreeDigits(maxTotal / count)}
            </span>
          </div>
          <div className="charting-statistics-row">
            <span className="charting-statistics-label">
              Stdev:
            </span>
            <span className="charting-statistics-value">
              {formatToThreeDigits(stddevTotal / count)}
            </span>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="charting-chart-container">
      <div className="charting-chart-inner">
        <div className="charting-chart-text">
          <LineChart
            width={600}
            height={300}
            data={data}
            margin={{
              top: 20,
              right: 10,
              left: 30,
              bottom: 10,
            }}
          >
            <Tooltip content={CustomTooltip} />
            {' '}
            {getLineChart(data)}
            <XAxis dataKey="name" stroke="#a6a5a6" />
            <YAxis
              type="number"
              stroke="#a6a5a6"
              domain={yAxisValuesArr}
              label={{
                value: `mean${formattedUnit}`,
                angle: -90,
                position: 'center',
                dx: -40,
              }}
            />
            <Legend formatter={() => `${title}`} />
          </LineChart>
        </div>
        <div className="charting-stat-text">
          <h3>
            <b>
              Average Statistics
              {formattedUnit}
            </b>
          </h3>
          <br />
          {getQuickStatistics(data)}
        </div>
      </div>
      <div className="charting-disclaimer">
        <strong className="charting-disclaimer-pre">Note: </strong>
        <span>Numerical analyses performed on imagery should only be used for initial basic exploratory purposes.</span>
        {isTruncated
        && (
          <div className="charting-disclaimer-lower">
            <FontAwesomeIcon
              icon="exclamation-triangle"
              className="wv-alert-icon"
              size="1x"
            />
            <i className="charting-disclaimer-block">
              As part of this beta feature release, the number of data points plotted between
              <b>
                {` ${startDate} `}
              </b>
              and
              <b>
                {` ${endDate} `}
              </b>
              has been reduced from
              <b>
                {` ${numRangeDays} `}
              </b>
              to
              <b>
                {` ${STEP_NUM}`}
              </b>
              .
            </i>
          </div>
        )}
      </div>
    </div>
  );
}

ChartComponent.propTypes = {
  liveData: PropTypes.object,
};

export default ChartComponent;
