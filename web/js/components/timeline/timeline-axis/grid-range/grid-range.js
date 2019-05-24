import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import TileRect from './tile-rect';
import TileText from './tile-text';

// determine if text will be rendered via itemDateObject param used with timeScale key
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
};

class GridRange extends PureComponent {
  render() {
    let { gridWidth, transformX, timeScale, timeRange, showHover } = this.props;
    let tileTextCondition = tileTextConditionOptions[timeScale];
    return (
      <g className="gridShell" transform={`translate(${transformX}, 0)`}>
        <React.Fragment>
          {timeRange.map((item, index) => {
            return (
              item.withinRange
                ? <React.Fragment key={index}>
                  <TileRect
                    item={item}
                    index={index}
                    gridWidth={gridWidth}
                    showHover={showHover}
                    timeScale={timeScale}
                  />
                  {tileTextCondition(item.dateObject)
                    ? <TileText
                      item={item}
                      index={index}
                      gridWidth={gridWidth}
                    />
                    : null }
                </React.Fragment>
                : null
            );
          }
          )}
        </React.Fragment>
      </g>
    );
  }
}

GridRange.propTypes = {
  timeRange: PropTypes.array,
  displayDate: PropTypes.func,
  gridWidth: PropTypes.number,
  showHover: PropTypes.func,
  timeScale: PropTypes.string,
  transformX: PropTypes.number
};

export default GridRange;
