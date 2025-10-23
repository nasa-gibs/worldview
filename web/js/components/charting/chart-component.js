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
    numPoints,
  } = liveData;

  // Arbitrary array of colors to use
  const lineColors = ['#A3905D', '#82CA9D', 'orange', 'pink', 'green', 'red', 'yellow', 'aqua', 'maroon'];
  const pointSizes = [3, 2, 1.5, 1.25];
  const formattedUnit = unit ? ` (${unit})` : '';

  function formatToThreeDigits(str) {
    if (parseFloat(str).toFixed(3).split('.')[0].length > 4) {
      return Number(parseFloat(str).toFixed(3)).toPrecision(3);
    }
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
      if (!Number.isNaN(payload[0].value)) {
        return (
          <div className="custom-tooltip">
            <p className="label" style={{ color: 'gray' }}>
              {label}
            </p>
            <p className="label" style={{ color: '#000' }}>
              <span className="custom-data-rect" style={{ backgroundColor: payload[0].color }} />
              {`${payload[0].name}${formattedUnit}: `}
              <b>
                {formatToThreeDigits(payload[0].value)}
              </b>
            </p>
          </div>
        );
      }
      return (
        <div className="custom-tooltip">
          <p className="label" style={{ color: 'gray' }}>
            {label}
          </p>
          <p className="label" style={{ color: '#000' }}>
            No data
          </p>
        </div>
      );
    }

    return null;
  }

  // Gets the indices of the tick positions so that they are evenly spaced
  function getTickPositions(dataLength) {
    // If dataLength is too small, just show first and last tick
    if (dataLength < 8) return [0, dataLength - 1];

    const numGaps = dataLength < 15 ? 4 : 5;
    const gapsArr = Array(numGaps).fill(Math.floor(dataLength / numGaps));

    // Last gap must be at least 3 to give extra room for end-aligned label
    gapsArr[gapsArr.length - 1] = Math.max(Math.floor(dataLength / 4), 3);

    const gapsTotal = gapsArr.reduce((a, b) => a + b, 0);
    let leftoverGap = (dataLength - 1) - gapsTotal;

    let i = 0;
    // Reduce gaps that are too large due to last gap size
    while (leftoverGap < 0 && i < numGaps - 1) {
      gapsArr[i] -= 1;
      leftoverGap += 1;
      i = (i + 1) % (numGaps - 1);
    }

    i = 0;
    // Distribute extra gaps across existing gaps
    while (leftoverGap > 0 && i < numGaps - 1) {
      gapsArr[i] += 1;
      leftoverGap -= 1;
      i = (i + 1) % (numGaps - 1);
    }

    // Build final array of tick positions based on calculated gaps
    const tickPosArr = [0];
    for (let i = 0; i < gapsArr.length; i += 1) {
      tickPosArr.push(tickPosArr[tickPosArr.length - 1] + gapsArr[i]);
    }
    tickPosArr[tickPosArr.length - 1] = dataLength - 1;

    return tickPosArr;
  }

  const tickPositions = getTickPositions(data.length);

  function CustomXAxisTick(obj) {
    const {
      x, y, fill, textAnchor, visibleTicksCount, index, payload,
    } = obj;
    const anchorPos = index === visibleTicksCount - 1 ? 'end' : textAnchor;
    const isLabeled = tickPositions.includes(index);
    if (isLabeled) {
      return (
        <g transform={`translate(${x}, ${y})`}>
          <line x1="0" y1="0" x2="0" y2="-8" stroke={fill} />
          <text x={anchorPos === 'end' ? 10 : 0} y={0} dy={16} textAnchor={anchorPos} fill={fill}>
            {payload.value}
          </text>
        </g>
      );
    }
    return (
      <g transform={`translate(${x}, ${y})`}>
        <line x1="0" y1="-4" x2="0" y2="-8" stroke={fill} />
      </g>
    );
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

    function CustomizedDot(props) {
      const {
        cx,
        cy,
        fill,
        stroke,
      } = props;
      const radius = pointSizes[Math.max(Math.floor(chartData.length / 26), 1) - 1];

      const transformFunc = `translate(${radius + 1} ${radius + 1})`;

      return (
        <svg x={cx - radius - 1} y={cy - radius - 1}>
          <g transform={transformFunc}>
            <circle r={radius + 0.5} fill={stroke} />
            <circle r={radius - 0.5} fill={fill} />
          </g>
        </svg>
      );
    }

    const chartLinesArr = chartLineName.map((id, index) => (
      <Line
        type="linear"
        key={id}
        dataKey={chartLineName[index]}
        stroke={lineColors[index]}
        dot={<CustomizedDot />}
      />
    ));
    return chartLinesArr;
  }

  /**
   * Processes each date in the chart data, computes & returns the averages as "quick statistics"
   * @param {Object} chartData
   */
  function getQuickStatistics(chartData) {
    let count = 0;
    let minTotal = 0;
    let maxTotal = 0;
    let meanTotal = 0;
    let medianTotal = 0;
    let stddevTotal = 0;

    for (let i = 0; i < chartData.length; i += 1) {
      if (!Number.isNaN(chartData[i].mean)) {
        meanTotal += chartData[i].mean;
        minTotal += chartData[i].min;
        maxTotal += chartData[i].max;
        medianTotal += chartData[i].median;
        stddevTotal += chartData[i].stddev;
        count += 1;
      }
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
            <XAxis dataKey="name" stroke="#a6a5a6" interval={0} tick={<CustomXAxisTick />} tickLine={false} />
            <YAxis
              type="number"
              stroke="#a6a5a6"
              domain={yAxisValuesArr}
              tickFormatter={(tick) => formatToThreeDigits(tick)}
              label={{
                value: `mean${formattedUnit}`,
                angle: -90,
                position: 'center',
                dx: -40,
              }}
            />
            <Legend
              formatter={() => `${title}`}
              wrapperStyle={{
                paddingTop: '7px',
              }}
            />
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
              widthAuto
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
              have been reduced from
              <b>
                {` ${numRangeDays} `}
              </b>
              to
              <b>
                {` ${numPoints}`}
              </b>
              .
            </i>
          </div>
        </div>
        <div className="charting-disclaimer">
          <strong className="charting-disclaimer-pre">Note: </strong>
          <span>Numerical analyses performed on imagery should only be used for initial basic exploratory purposes.</span>
          {isTruncated
          && (
            <div className="charting-disclaimer-upper">
              <FontAwesomeIcon
                icon="exclamation-triangle"
                className="wv-alert-icon"
                size="1x"
                widthAuto
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
                have been reduced from
                <b>
                  {` ${numRangeDays} `}
                </b>
                to
                <b>
                  {` ${numPoints}`}
                </b>
                .
              </i>
            </div>
          )}
          {errors && errors.error_count > 0
          && (
            <div className="charting-disclaimer-lower">
              <FontAwesomeIcon
                icon="exclamation-triangle"
                className="wv-alert-icon"
                size="1x"
                widthAuto
              />
              <i className="charting-disclaimer-block">
                {`${errors.error_count} `}
                {errors.error_count === 1 ? 'requested date has no data and is represented as a gap in the chart.' : 'requested dates have no data and are represented as gaps in the chart.'}
              </i>
              {!errorCollapsed
              && (
                <div className="charting-disclaimer-dates">
                  <i className="charting-disclaimer-block">
                    {errorDaysArr.map((date, index) => (
                      <>
                        {date.split('T')[0]}
                        {index < errorDaysArr.length - 1 && ', '}
                        &nbsp;&nbsp;
                      </>
                    ))}
                  </i>
                </div>
              )}
              <div className="error-expand-button">
                <span className="error-expand-button-inner" onClick={() => setErrorCollapsed(!errorCollapsed)}>
                  {errorCollapsed ? 'more' : 'less'}
                  <FontAwesomeIcon
                    className="layer-group-collapse"
                    icon={!errorCollapsed ? 'caret-up' : 'caret-down'}
                    widthAuto
                  />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ChartComponent.propTypes = {
  liveData: PropTypes.object,
};

export default ChartComponent;
