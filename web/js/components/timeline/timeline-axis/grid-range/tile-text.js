import React from 'react';

/**
* @desc Wrapper for TileText to determine what time unit to display
* @param {Object} item
* @param {Number} index
* @param {Number} gridWidth
* @returns {Object} svg text DOM object
*/
const axisScaleTextElementWrapper = (item, index, gridWidth) => {
  const indexGridWithCoeff = index * gridWidth;
  let dateText;
  let dateTextYear;
  if (item.timeScale === 'day') {
    const dateSplit = item.date.split(' ');
    [dateText, dateTextYear] = dateSplit;
  } else {
    dateText = item.date;
  }
  if (item.timeScale === 'hour') {
    const timeScaleUnit = item.dateObject.hours;
    dateText = timeScaleUnit === 12
      || timeScaleUnit === 6
      || timeScaleUnit === 18
      ? `${timeScaleUnit}:00`
      : item.date;
  }
  let xOffsetAdded = 8;
  if (item.timeScale === 'month' || item.timeScale === 'year') {
    xOffsetAdded = 5;
  }
  return (
    <g
      transform={`translate(${indexGridWithCoeff + xOffsetAdded})`}
    >
      <text
        className={`axis-grid-text axis-grid-text-${item.timeScale}`}
        x="0"
        y="62"
        fill="white"
        clipPath="url(#textDisplay)"
      >
        {dateText}
      </text>
      {item.timeScale === 'day'
        ? (
          <text
            className="axis-grid-text axis-grid-text-year"
            x="40"
            y="62"
            fill="#cccccc"
            clipPath="url(#textDisplay)"
          >
            {dateTextYear}
          </text>
        )
        : null}
    </g>
  );
};

const TileText = ({ item, index, gridWidth }) => axisScaleTextElementWrapper(item, index, gridWidth);
export default TileText;
