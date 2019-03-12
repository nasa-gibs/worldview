import React, { PureComponent } from 'react';
import moment from 'moment';

//# PureComponent performs a shallow comparison of props and state - may not need shouldComponentUpdate
class GridRange extends PureComponent {
// constructor(props) {
//   super(props);
//   this.state= {
//     hoverLinePosition: 0
//   }
// }

  showHover = (e, itemDate, nextDate, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.persist();
    // let target = e.target;
    // let clientX = e.clientX;
    // let boundingClientRect = target.getBoundingClientRect();
    // //! IE11 doesn't like boundingClientRect.x
    // let xHoverPositionInCurrentGrid = Math.floor(clientX) - Math.floor(boundingClientRect.left);
    requestAnimationFrame(() => {
      let target = e.target;
      let clientX = e.clientX;
      let boundingClientRect = target.getBoundingClientRect();
      //! IE11 doesn't like boundingClientRect.x
      let xHoverPositionInCurrentGrid = Math.floor(clientX) - Math.floor(boundingClientRect.left);

      let gridWidth = this.props.gridWidth;
      // let boundingClientRect = e.target.getBoundingClientRect();
      // //! IE11 doesn't like boundingClientRect.x
      // let xHoverPositionInCurrentGrid = Math.floor(e.clientX) - Math.floor(boundingClientRect.left);

      let currentDateValue = moment.utc(itemDate).valueOf();
      let nextDateValue = moment.utc(nextDate).valueOf();
      let diff = nextDateValue - currentDateValue;
      let diffFactor = diff / gridWidth; // gridWidth
      let displayDate = moment.utc(currentDateValue + (xHoverPositionInCurrentGrid * diffFactor)).format();
      this.props.displayDate(displayDate, clientX);
      // this.setState({
      //   hoverLinePosition: index * gridWidth + xHoverPositionInCurrentGrid
      // })
    })
  }

  componentDidUpdate(prevProps, prevState) {
    //# Dragger changes are tied too close to this.props.transformX since add/minus click dragger and this updates
    //# decouple
    // console.log('GridRange update', prevProps, prevState)
  }

  render() {
    let gridWidth = this.props.gridWidth;
    return (
      <g className="gridShell" transform={`translate(${this.props.transformX}, 0)`}>
        <TileHolder dateArray={this.props.dateArray} gridWidth={gridWidth} showHover={this.showHover} timeScale={this.props.timeScale} />
        {/* <line className="svgLine" stroke="blue" strokeWidth="2" strokeOpacity="0.48" x1="0" x2="0" y1="0" y2="90" transform={`translate(${this.state.hoverLinePosition + 2}, 0)`} shapeRendering="optimizeSpeed"/> */}
      </g>
    )
  }
}

const tileTextConditionOptions = {
  minute: (itemDateObject) => {
    let timeScaleUnit = itemDateObject.minutes;
    return timeScaleUnit === 0 || 
      timeScaleUnit === 15 || 
      timeScaleUnit === 30 ||
      timeScaleUnit === 45;
  },
  hour: (itemDateObject) => {
    let timeScaleUnit = itemDateObject.hours;
    return timeScaleUnit === 0 || 
    timeScaleUnit === 6 || 
    timeScaleUnit === 12 ||
    timeScaleUnit === 18;
  },
  day: (itemDateObject) => {
    let timeScaleUnit = itemDateObject.date;
    return timeScaleUnit === 1;
  },
  month: (itemDateObject) => {
    let timeScaleUnit = itemDateObject.months;
    return timeScaleUnit === 0;
  },
  year: (itemDateObject) => {
    let timeScaleUnit = itemDateObject.years;
    return timeScaleUnit % 10 === 0;
  }
}

class TileHolder extends PureComponent {
  render() {
    let timeScale = this.props.timeScale;
    let tileTextCondition = tileTextConditionOptions[timeScale];
    let midTile = Math.floor(this.props.dateArray.length / 2);
    return (
      <React.Fragment>
        {this.props.dateArray.map((item, index) => {
          return (
            item.withinRange ?
            <React.Fragment key={index}>
              <TileRect
                item={item}
                index={index}
                gridWidth={this.props.gridWidth}
                showHover={this.props.showHover}
                midTile={midTile === index ? true : false}
              />
              {tileTextCondition(item.dateObject) ?
              <TileText
                item={item}
                index={index}
                gridWidth={this.props.gridWidth}
              />
              : null }
            </React.Fragment>
            : null
          )
        }
        )}
      </React.Fragment>
    )
  }
}

const axisScaleGridElement = {
  minute: (gridWidth, index, item) => {
    let timeScaleUnit = item.dateObject.minutes;
    let lineLengthY = timeScaleUnit === 0 || 
        timeScaleUnit === 15 || 
        timeScaleUnit === 30 ||
        timeScaleUnit === 45 ? 58 : timeScaleUnit % 5 === 0 ? 20 : 10;
    return (
      <React.Fragment>
        <rect className="grid" width={gridWidth} height={100} transform={`translate(${index * gridWidth}, 0)`} fill={item.withinRange ? 'rgba(0,0,0,0)' : 'black'} shapeRendering="optimizeSpeed"></rect>
        <line stroke="black" strokeLinecap="round" strokeWidth="0.2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 2.2}, 0)`} />
        <line stroke="white" strokeLinecap="round" strokeWidth="2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 1}, 0)`} />
      </React.Fragment>
    )
  },
  hour: (gridWidth, index, item) => {
    let timeScaleUnit = item.dateObject.hours;
    let lineLengthY = timeScaleUnit === 0 ? 58 : 
                      timeScaleUnit === 6 || 
                      timeScaleUnit === 12 ||
                      timeScaleUnit === 18 ? 22 : 10;
    // let lineLengthY = timeScaleUnit === 0 ? 58 : timeScaleUnit === 12 ? 22 : 10;
    return (
      <React.Fragment>
        <rect className="grid" width={gridWidth} height={100} transform={`translate(${index * gridWidth}, 0)`} fill={item.withinRange ? 'rgba(0,0,0,0)' : 'black'} shapeRendering="optimizeSpeed"></rect>
        <line stroke="black" strokeLinecap="round" strokeWidth="0.2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 2.2}, 0)`} />
        <line stroke="white" strokeLinecap="round" strokeWidth="2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 1}, 0)`} />
      </React.Fragment>
    )
  },
  day: (gridWidth, index, item, midTile) => {
    let dayOfWeek = item.dayOfWeek;
    let lineLengthY = item.dateObject.date === 1 ? 58 : dayOfWeek === 0 ? 22 : 10;
    return (
      <React.Fragment>
        {/* <rect className="grid" width={gridWidth} height={100} transform={`translate(${index * gridWidth}, 0)`} fill={item.withinRange ? 'rgba(0,0,0,0)' : 'black'} shapeRendering="optimizeSpeed"></rect> */}
        <rect className="grid" width={gridWidth} height={100} transform={`translate(${index * gridWidth}, 0)`} fill={midTile ? 'yellow' : 'rgba(0,0,0,0)'} shapeRendering="optimizeSpeed"></rect>
        <line stroke="black" strokeLinecap="round" strokeWidth="0.2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 2.2}, 0)`} />
        <line stroke="white" strokeLinecap="round" strokeWidth="2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 1}, 0)`} />
      </React.Fragment>
    )
  },
  month: (gridWidth, index, item) => {
    let timeScaleUnit = item.dateObject.months;
    let lineLengthY = timeScaleUnit === 0 ? 58 : timeScaleUnit % 3 === 0 ? 22 : 10;
    return (
      <React.Fragment>
        <rect className="grid" width={gridWidth} height={100} transform={`translate(${index * gridWidth}, 0)`} fill={item.withinRange ? 'rgba(0,0,0,0)' : 'black'} shapeRendering="optimizeSpeed"></rect>
        <line stroke="black" strokeLinecap="round" strokeWidth="0.2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 2.2}, 0)`} />
        <line stroke="white" strokeLinecap="round" strokeWidth="2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 1}, 0)`} />
      </React.Fragment>
    )
  },
  year: (gridWidth, index, item) => {
    let timeScaleUnit = item.dateObject.years;
    let lineLengthY = timeScaleUnit % 10 === 0 ? 58 : timeScaleUnit % 5 === 0 ? 22 : 10;
    return (
      <React.Fragment>
        <rect className="grid" width={gridWidth} height={100} transform={`translate(${index * gridWidth}, 0)`} fill={item.withinRange ? 'rgba(0,0,0,0)' : 'black'} shapeRendering="optimizeSpeed"></rect>
        <line stroke="black" strokeLinecap="round" strokeWidth="0.2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 2.2}, 0)`} />
        <line stroke="white" strokeLinecap="round" strokeWidth="2" x1="0" x2="0" y1="0" y2={lineLengthY} transform={`translate(${index * gridWidth + 1}, 0)`} />
      </React.Fragment>
    )
  },
}

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

class TileRect extends PureComponent {
  // componentDidUpdate() {
  //   console.log('TileRect update')
  // }
  render() {
    let { item, gridWidth, index, midTile, showHover } = this.props;
    // console.log(item.dateObject)
    return (
      <React.Fragment>
        <g onMouseMove={(e) => showHover(e, item.rawDate, item.rawNextDate, index)}>
          { axisScaleGridElement[item.timeScale](gridWidth, index, item, midTile) }
        </g>
      </React.Fragment>
    )
  }
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

export default GridRange;