import React, { PureComponent } from 'react';

const axisScaleTextElement = {
  minute: (gridWidth, index, item) => {
    return (
      <React.Fragment>
        <g>
          <text className="gridText" x="0" y="45" fill={item.withinRange ? 'white' : ''} transform={`translate(${(index * gridWidth) + 8}, 20)`} textRendering="optimizeLegibility" clipPath="url(#textDisplay)">{item.date}</text>
        </g>
      </React.Fragment>
    )
  },
  hour: (gridWidth, index, item) => {
    let timeScaleUnit = item.dateObject.hours;
    let dateText = timeScaleUnit === 12 || timeScaleUnit === 6 || timeScaleUnit === 18 ? `${timeScaleUnit}:00` : item.date;
    return (
      <React.Fragment>
        <g>
          <text className="gridText" x="0" y="45" fill={item.withinRange ? 'white' : ''} transform={`translate(${(index * gridWidth) + 8}, 20)`} textRendering="optimizeLegibility" clipPath="url(#textDisplay)">{dateText}</text>
        </g>
      </React.Fragment>
    )
  },
  day: (gridWidth, index, item) => {
    // let timeScaleUnit = item.dateObject.date;
    return (
      <React.Fragment>
        <g>
          <text className="gridText" x="0" y="45" fill={item.withinRange ? 'white' : ''} transform={`translate(${(index * gridWidth) + 8}, 20)`} textRendering="optimizeLegibility" clipPath="url(#textDisplay)">{item.date}</text>
        </g>
      </React.Fragment>
    )
  },
  month: (gridWidth, index, item) => {
    // let timeScaleUnit = item.dateObject.months;
    return (
      <React.Fragment>
        <g>
          <text className="gridText" x="0" y="45" fill={item.withinRange ? 'white' : ''} transform={`translate(${(index * gridWidth) + 5}, 20)`} textRendering="optimizeLegibility" clipPath="url(#textDisplay)">{item.date}</text>
        </g>
      </React.Fragment>
    )
  },
  year: (gridWidth, index, item) => {
    // let timeScaleUnit = item.dateObject.years;
    return (
      <React.Fragment>
        <g>
          <text className="gridText" x="0" y="45" fill={item.withinRange ? 'white' : ''} transform={`translate(${(index * gridWidth) + 5}, 20)`} textRendering="optimizeLegibility" clipPath="url(#textDisplay)">{item.date}</text>
        </g>
      </React.Fragment>
    )
  },
}


class TileText extends PureComponent {
  //# TODO: all of these (if visible or not) are being updated - should optimize so only visible are shown
  // componentDidUpdate() {
  //   console.log('TileText update')
  // }
  render() {
    let { item, gridWidth, index } = this.props;
    // console.log(item)
    return (
      axisScaleTextElement[item.timeScale](gridWidth, index, item)
    )
  }
}

// FUNCTIONAL COMPONENT VERSION OF ABOVE - less code in compile
// const TileText = ({ item, gridWidth, index }) => {
//   return (
//     axisScaleTextElement[item.timeScale](gridWidth, index, item)
//   )
// }

export default TileText;