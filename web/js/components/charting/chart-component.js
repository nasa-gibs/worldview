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
    return Object.keys(obj[0]).filter((val) => val !== 'name');
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
      </div>
    </>
  );
}

ChartComponent.propTypes = {
  liveData: PropTypes.object,
};

export default ChartComponent;
