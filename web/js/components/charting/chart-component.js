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
  const lineColors = ['#8884D8', '#82CA9D', 'orange', 'pink', 'blue', 'green', 'red', 'yellow', 'aqua', 'maroon'];

  function getLineChart(chartData) {
    const dataKeys = Object.keys(chartData[0]).slice(1);

    const chartLinesArr = dataKeys.map((id, index) => (
      <Line
        type="linear"
        key={id} // XAxis (date) value
        dataKey={dataKeys[index]}
        stroke={lineColors[index]}
      />
    ));
    return chartLinesArr;
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
