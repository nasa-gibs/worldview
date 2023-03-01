import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Legend,
} from 'recharts';

class ChartingChartComponent extends React.Component {
  data = [
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

  lineColors = ['#8884D8', '#82CA9D', 'orange', 'pink'];

  getLineChart = (props) => {
    // console.log(props);
    // const { data, lineColors } = this.props;

    console.log(this.data);
    const dataKeys = Object.keys(this.data[0]).slice(1);

    const chartLinesArr = dataKeys.map((id, index) => (
      <Line
        type="linear"
        key={id}
        dataKey={dataKeys[index]}
        stroke={this.lineColors[index]}
      />
    ));
    return chartLinesArr;
  };

  render() {
    return (
      <>
        <div className="charting-chart-container">
          <div className="charting-chart-text">
            <h3>Show Chart Here!</h3>
            <LineChart width={600} height={300} data={this.data}>
              <Legend />
              {this.getLineChart()}
              <XAxis datakey="name" />
              <YAxis />
              <Legend />
            </LineChart>
          </div>
        </div>
      </>
    );
  }
}

export default ChartingChartComponent;
