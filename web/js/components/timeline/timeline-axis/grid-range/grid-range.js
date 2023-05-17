import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import TileRect from './tile-rect';
import TileText from './tile-text';

/**
* @desc object key used for TileText
* @param {String} timeScale
* @returns {Function} used to determine if text will be rendered
*/
const tileTextConditionOptions = {
  minute: (itemDateObject) => {
    const timeScaleUnit = itemDateObject.minutes;
    return timeScaleUnit === 0
      || timeScaleUnit === 15
      || timeScaleUnit === 30
      || timeScaleUnit === 45;
  },
  hour: (itemDateObject) => {
    const timeScaleUnit = itemDateObject.hours;
    return timeScaleUnit === 0
    || timeScaleUnit === 6
    || timeScaleUnit === 12
    || timeScaleUnit === 18;
  },
  day: (itemDateObject) => {
    const timeScaleUnit = itemDateObject.date;
    return timeScaleUnit === 1;
  },
  month: (itemDateObject) => {
    const timeScaleUnit = itemDateObject.months;
    return timeScaleUnit === 0;
  },
  year: (itemDateObject) => {
    const timeScaleUnit = itemDateObject.years;
    return timeScaleUnit % 10 === 0;
  },
};

class GridRange extends PureComponent {
  render() {
    const {
      gridWidth,
      transformX,
      timeScale,
      timeRange,
      showHover,
    } = this.props;
    const tileTextCondition = tileTextConditionOptions[timeScale];
    return (
      <g
        className="axis-grid-container"
        transform={`translate(${transformX})`}
      >
        {timeRange.map((item, index) => (
          item.withinRange
            ? (
          /* eslint react/no-array-index-key: 1 */
              <React.Fragment key={index}>
                <TileRect
                  item={item}
                  index={index}
                  gridWidth={gridWidth}
                  showHover={showHover}
                  timeScale={timeScale}
                />
                {tileTextCondition(item.dateObject)
                  ? (
                    <TileText
                      item={item}
                      index={index}
                      gridWidth={gridWidth}
                    />
                  )
                  : null }
              </React.Fragment>
            )
            : null
        ))}
      </g>
    );
  }
}

GridRange.propTypes = {
  gridWidth: PropTypes.number,
  showHover: PropTypes.func,
  timeRange: PropTypes.array,
  timeScale: PropTypes.string,
  transformX: PropTypes.number,
};

export default GridRange;
