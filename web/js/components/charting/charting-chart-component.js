import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Legend,
} from 'recharts';
import PropTypes from 'prop-types';

function ChartingChartComponent (props) {
  const {
    liveData,
  } = props;

  // const { data } = liveData;
  const data = [
    {
      name: 'January',
      Google: 467,
      Yahoo: 369,
      Bing: 415,
    },
    {
      name: 'February',
      Google: 861,
      Yahoo: 78,
      Bing: 351,
    },
    {
      name: 'March',
      Google: 601,
      Yahoo: 716,
      Bing: 675,
    },
    {
      name: 'April',
      Google: 833,
      Yahoo: 875,
      Bing: 802,
    },
    {
      name: 'May',
      Google: 436,
      Yahoo: 718,
      Bing: 378,
    },
    {
      name: 'June',
      Google: 818,
      Yahoo: 240,
      Bing: 492,
    },
    {
      name: 'July',
      Google: 23,
      Yahoo: 574,
      Bing: 325,
    },
  ];

  const lineColors = ['#8884D8', '#82CA9D', 'orange', 'pink'];

  function getLineChart(data) {
    console.log('data');
    console.log(data);

    // dataKeys are the XAxis values (dates). These are used to align the values
    const dataKeys = Object.keys(data[0]).slice(1);
    console.log('dataKeys');
    console.log(dataKeys);
    const chartLinesArr = dataKeys.map((id, index) => (
      <Line
        type="linear"
        key={id} // XAxis (date) value
        dataKey={dataKeys[index]}
        // stroke={lineColors[index]}
      />
    ));
    console.log('chartLinesArr');
    console.log(chartLinesArr);
    return chartLinesArr;
  }

  return (
    <>
      <div className="charting-chart-container">
        <div className="charting-chart-text">
          <LineChart width={600} height={300} data={data}>
            <Legend />
            {getLineChart(data)}
            <XAxis datakey="name" />
            <YAxis />
            <Legend />
          </LineChart>
        </div>
      </div>
    </>
  );
}

ChartingChartComponent.propTypes = {
  liveData: PropTypes.object,
};

export default ChartingChartComponent;
