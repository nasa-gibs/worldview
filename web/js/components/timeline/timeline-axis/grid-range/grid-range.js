import React, { PureComponent } from 'react';
import moment from 'moment';

import TileRect from './tile-rect';
import TileText from './tile-text';

//# PureComponent performs a shallow comparison of props and state - may not need shouldComponentUpdate
class GridRange extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // hoverLinePosition: 0
    }
  }

  // showHover = (e, itemDate, nextDate, index) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   e.persist();
  //   requestAnimationFrame(() => {
  //     let target = e.target;
  //     let clientX = e.clientX;
  //     let boundingClientRect = target.getBoundingClientRect();
  //     let xHoverPositionInCurrentGrid = Math.floor(clientX) - Math.floor(boundingClientRect.left);
  //     let gridWidth = this.props.gridWidth;

  //     let currentDateValue = moment.utc(itemDate).valueOf();
  //     let nextDateValue = moment.utc(nextDate).valueOf();
  //     let diff = nextDateValue - currentDateValue;
  //     let diffFactor = diff / gridWidth; // gridWidth
  //     let displayDate = moment.utc(currentDateValue + (xHoverPositionInCurrentGrid * diffFactor)).format();
  //     this.props.displayDate(displayDate, clientX);
  //     this.setState({
  //       hoverLinePosition: index * gridWidth + xHoverPositionInCurrentGrid
  //     })
  //   })
  // }

  componentDidUpdate(prevProps, prevState) {
  }

  render() {
    let gridWidth = this.props.gridWidth;
    return (
      <g className="gridShell" transform={`translate(${this.props.transformX}, 0)`}>
        <TileHolder
          timeScale={this.props.timeScale}
          dateArray={this.props.dateArray}
          gridWidth={gridWidth}
          showHover={this.props.showHover}
        />
        {/* <line className="svgLine" style={{display: this.props.showHoverLine ? 'block' : 'none'}}
          stroke="blue" strokeWidth="2" strokeOpacity="0.48" x1="0" x2="0" y1="0" y2="63"
          transform={`translate(${this.state.hoverLinePosition + 1}, 0)`} shapeRendering="optimizeSpeed"/> */}
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

export default GridRange;