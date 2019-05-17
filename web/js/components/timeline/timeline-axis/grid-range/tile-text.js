import React, { PureComponent } from 'react';

// const axisScaleTextElement = {
//   minute: (gridWidth, index, item) => {
//     return (
//       <React.Fragment>
//         <g>
//           <text className="gridText" x="0" y="45" fill={item.withinRange ? 'white' : ''} transform={`translate(${(index * gridWidth) + 8}, 20)`} textRendering="optimizeLegibility" clipPath="url(#textDisplay)">{item.date}</text>
//         </g>
//       </React.Fragment>
//     )
//   },
//   hour: (gridWidth, index, item) => {
//     let timeScaleUnit = item.dateObject.hours;
//     let dateText = timeScaleUnit === 12 || timeScaleUnit === 6 || timeScaleUnit === 18 ? `${timeScaleUnit}:00` : item.date;
//     return (
//       <React.Fragment>
//         <g>
//           <text className="gridText" x="0" y="45" fill={item.withinRange ? 'white' : ''} transform={`translate(${(index * gridWidth) + 8}, 20)`} textRendering="optimizeLegibility" clipPath="url(#textDisplay)">{dateText}</text>
//         </g>
//       </React.Fragment>
//     )
//   },
//   day: (gridWidth, index, item) => {
//     return (
//       <React.Fragment>
//         <g>
//           <text className="gridText" x="0" y="45" fill={item.withinRange ? 'white' : ''} transform={`translate(${(index * gridWidth) + 8}, 20)`} textRendering="optimizeLegibility" clipPath="url(#textDisplay)">{item.date}</text>
//         </g>
//       </React.Fragment>
//     )
//   },
//   month: (gridWidth, index, item) => {
//     return (
//       <React.Fragment>
//         <g>
//           <text className="gridText" x="0" y="45" fill={item.withinRange ? 'white' : ''} transform={`translate(${(index * gridWidth) + 5}, 20)`} textRendering="optimizeLegibility" clipPath="url(#textDisplay)">{item.date}</text>
//         </g>
//       </React.Fragment>
//     )
//   },
//   year: (gridWidth, index, item) => {
//     return (
//       <React.Fragment>
//         <g>
//           <text className="gridText" x="0" y="45" fill={item.withinRange ? 'white' : ''} transform={`translate(${(index * gridWidth) + 5}, 20)`} textRendering="optimizeLegibility" clipPath="url(#textDisplay)">{item.date}</text>
//         </g>
//       </React.Fragment>
//     )
//   },
// }

// class TileText extends PureComponent {
//   //# TODO: all of these (if visible or not) are being updated - should optimize so only visible are shown
//   render() {
//     let { item, gridWidth, index } = this.props;
//     return (
//       axisScaleTextElement[item.timeScale](gridWidth, index, item)
//     )
//   }
// }

// FUNCTIONAL COMPONENT VERSION OF ABOVE - less code in compile
const axisScaleTextElementWrapper = (gridWidth, index, item) => {
  let dateText = item.date;
  if (item.timeScale === 'hour') {
    let timeScaleUnit = item.dateObject.hours;
    dateText = timeScaleUnit === 12 || timeScaleUnit === 6 || timeScaleUnit === 18 ? `${timeScaleUnit}:00` : item.date;
  }
  let xOffsetAdded = 8;
  if (item.timeScale === 'month' || item.timeScale === 'year') {
    xOffsetAdded = 5;
  }
  return (
    <React.Fragment>
      <g>
        <text className="gridText" x="0" y="42" fill={item.withinRange ? 'white' : ''} transform={`translate(${(index * gridWidth) + xOffsetAdded}, 20)`} textRendering="optimizeLegibility" clipPath="url(#textDisplay)">{dateText}</text>
      </g>
    </React.Fragment>
  );
};

const TileText = ({ item, gridWidth, index }) => {
  return (
    axisScaleTextElementWrapper(gridWidth, index, item)
  );
};

export default TileText;
