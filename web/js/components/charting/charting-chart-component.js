import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Legend,
} from 'recharts';
import PropTypes from 'prop-types';

function ChartingChartComponent (props) {
  const {
    liveData,
  } = props;

  const { data } = liveData;
  //   {
  //     name: 'January',
  //     Google: 467,
  //     Yahoo: 369,
  //     Bing: 415,
  //   },
  //   {
  //     name: 'February',
  //     Google: 861,
  //     Yahoo: 78,
  //     Bing: 351,
  //   },
  //   {
  //     name: 'March',
  //     Google: 601,
  //     Yahoo: 716,
  //     Bing: 675,
  //   },
  //   {
  //     name: 'April',
  //     Google: 833,
  //     Yahoo: 875,
  //     Bing: 802,
  //   },
  //   {
  //     name: 'May',
  //     Google: 436,
  //     Yahoo: 718,
  //     Bing: 378,
  //   },
  //   {
  //     name: 'June',
  //     Google: 818,
  //     Yahoo: 240,
  //     Bing: 492,
  //   },
  //   {
  //     name: 'July',
  //     Google: 23,
  //     Yahoo: 574,
  //     Bing: 325,
  //   },
  // ];
  const lineColors = ['#8884D8', '#82CA9D', 'orange', 'pink'];
  const dataKeys = [];
  for (let i = 0; i < data.length; i++) {
    dataKeys.push(data[i].name);
  }

  function getLineChart(data) {
    const chartLinesArr = dataKeys.map((name, index) => (
      <Line
        type="linear"
        key={name}
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
