import React, { PureComponent } from 'react';

const axisScaleGridElement = {
  minute: (gridWidth, index, item) => {
    let timeScaleUnit = item.dateObject.minutes;
    let lineLengthY = timeScaleUnit === 0 ||
        timeScaleUnit === 15 ||
        timeScaleUnit === 30 ||
        timeScaleUnit === 45 ? 58 : timeScaleUnit % 5 === 0 ? 20 : 10;
    let whiteLineStrokeWidth = lineLengthY !== 10 ? 2 : 1;
    return (
      <React.Fragment>
        <rect className="grid" width={gridWidth} height={100} transform={`translate(${index * gridWidth}, 0)`} fill={item.withinRange ? 'rgba(0,0,0,0)' : 'black'} shapeRendering="optimizeSpeed"></rect>
        <line stroke="black" strokeLinecap="round" strokeWidth="0.2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 2.2}, 0)`} />
        <line stroke="white" strokeLinecap="round" strokeWidth={whiteLineStrokeWidth} x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 1}, 0)`} />
      </React.Fragment>
    )
  },
  hour: (gridWidth, index, item) => {
    let timeScaleUnit = item.dateObject.hours;
    let lineLengthY = timeScaleUnit === 0 ? 58 :
                      timeScaleUnit === 6 ||
                      timeScaleUnit === 12 ||
                      timeScaleUnit === 18 ? 22 : 10;
    let whiteLineStrokeWidth = lineLengthY !== 10 ? 2 : 1;
    return (
      <React.Fragment>
        <rect className="grid" width={gridWidth} height={100} transform={`translate(${index * gridWidth}, 0)`} fill={item.withinRange ? 'rgba(0,0,0,0)' : 'black'} shapeRendering="optimizeSpeed"></rect>
        <line stroke="black" strokeLinecap="round" strokeWidth="0.2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 2.2}, 0)`} />
        <line stroke="white" strokeLinecap="round" strokeWidth={whiteLineStrokeWidth} x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 1}, 0)`} />
      </React.Fragment>
    )
  },
  day: (gridWidth, index, item) => {
    let dayOfWeek = item.dayOfWeek;
    let lineLengthY = item.dateObject.date === 1 ? 58 : dayOfWeek === 0 ? 22 : 10;
    let whiteLineStrokeWidth = lineLengthY !== 10 ? 2 : 1;
    return (
      <React.Fragment>
        <rect className="grid" width={gridWidth} height={100} transform={`translate(${index * gridWidth}, 0)`} fill={item.withinRange ? 'rgba(0,0,0,0)' : 'black'} shapeRendering="optimizeSpeed"></rect>
        <line stroke="black" strokeLinecap="round" strokeWidth="0.2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 2.2}, 0)`} />
        <line stroke="white" strokeLinecap="round" strokeWidth={whiteLineStrokeWidth} x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 1}, 0)`} />
      </React.Fragment>
    )
  },
  month: (gridWidth, index, item) => {
    let timeScaleUnit = item.dateObject.months;
    let lineLengthY = timeScaleUnit === 0 ? 58 : timeScaleUnit % 3 === 0 ? 22 : 10;
    let whiteLineStrokeWidth = lineLengthY !== 10 ? 2 : 1;
    return (
      <React.Fragment>
        <rect className="grid" width={gridWidth} height={100} transform={`translate(${index * gridWidth}, 0)`} fill={item.withinRange ? 'rgba(0,0,0,0)' : 'black'} shapeRendering="optimizeSpeed"></rect>
        <line stroke="black" strokeLinecap="round" strokeWidth="0.2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 2.2}, 0)`} />
        <line stroke="white" strokeLinecap="round" strokeWidth={whiteLineStrokeWidth} x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 1}, 0)`} />
      </React.Fragment>
    )
  },
  year: (gridWidth, index, item) => {
    let timeScaleUnit = item.dateObject.years;
    let lineLengthY = timeScaleUnit % 10 === 0 ? 58 : timeScaleUnit % 5 === 0 ? 22 : 10;
    let whiteLineStrokeWidth = lineLengthY !== 10 ? 2 : 1;
    return (
      <React.Fragment>
        <rect className="grid" width={gridWidth} height={100} transform={`translate(${index * gridWidth}, 0)`} fill={item.withinRange ? 'rgba(0,0,0,0)' : 'black'} shapeRendering="optimizeSpeed"></rect>
        <line stroke="black" strokeLinecap="round" strokeWidth="0.2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 2.2}, 0)`} />
        <line stroke="white" strokeLinecap="round" strokeWidth={whiteLineStrokeWidth} x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 1}, 0)`} />
      </React.Fragment>
    )
  },
}

class TileRect extends PureComponent {
  render() {
    let { item, gridWidth, index, showHover } = this.props;
    return (
      <React.Fragment>
        <g onMouseMove={(e) => showHover(e, item.rawDate, item.rawNextDate, index)}>
          { axisScaleGridElement[item.timeScale](gridWidth, index, item) }
        </g>
      </React.Fragment>
    );
  }
}

export default TileRect;
