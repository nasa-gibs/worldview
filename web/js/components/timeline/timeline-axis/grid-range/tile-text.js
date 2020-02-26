import React from 'react';

/**
* @desc Wrapper for TileText to determine what time unit to display
* @param {Object} item
* @param {Number} index
* @param {Number} gridWidth
* @returns {Object} svg text DOM object
*/
const axisScaleTextElementWrapper = (item, index, gridWidth) => {
  let dateText;
  let dateTextYear;
  // TODO: may need to expand for subdaily to differentiate time units
  if (item.timeScale === 'day') {
    const dateSplit = item.date.split(' ');
    dateText = dateSplit[0];
    dateTextYear = dateSplit[1];
  } else {
    dateText = item.date;
  }
  if (item.timeScale === 'hour') {
    const timeScaleUnit = item.dateObject.hours;
    dateText = timeScaleUnit === 12 ||
      timeScaleUnit === 6 ||
      timeScaleUnit === 18
      ? `${timeScaleUnit}:00`
      : item.date;
  }
  let xOffsetAdded = 8;
  if (item.timeScale === 'month' || item.timeScale === 'year') {
    xOffsetAdded = 5;
  }
  return (
    <React.Fragment>
      <text className={`axis-grid-text axis-grid-text-${item.timeScale}`} x="0" y="42"
        fill={item.withinRange ? 'white' : ''}
        transform={`translate(${(index * gridWidth) + xOffsetAdded}, 20)`}
        clipPath="url(#textDisplay)"
      >
        {dateText}
      </text>
      {item.timeScale === 'day'
        ? <text className="axis-grid-text axis-grid-text-year" x="0" y="42"
          fill={item.withinRange ? '#cccccc' : ''}
          transform={`translate(${(index * gridWidth) + xOffsetAdded + 40}, 20)`}
          clipPath="url(#textDisplay)"
        >
          {dateTextYear}
        </text>
        : null
      }
    </React.Fragment>
  );
};

const TileText = ({ item, index, gridWidth }) => {
  return (
    axisScaleTextElementWrapper(item, index, gridWidth)
  );
};

export default TileText;
