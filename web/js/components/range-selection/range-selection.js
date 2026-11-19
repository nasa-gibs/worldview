import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Dragger from './dragger';
import DraggerRange from './dragger-range';

import { timeScaleOptions } from '../../modules/date/constants';
/*
 * A react component, is a draggable svg
 * group. It is a parent component that
 * rerenders when child elements are dragged
 *
 * @class TimelineRangeSelector
 */
const TimelineRangeSelector = ({
  startLocation: startLocationProp,
  endLocation: endLocationProp,
  axisWidth,
  endColor = '#295f92',
  endLocationDate,
  endTriangleColor = '#4b7aab',
  frontDate,
  max,
  pinWidth = 5,
  position,
  rangeColor = '#45bdff',
  rangeOpacity = 0.3,
  startColor = '#40a9db',
  startLocationDate,
  startTriangleColor = '#fff',
  timelineEndDateLimit,
  timelineStartDateLimit,
  timeScale,
  transformX,
  updateAnimationDateAndLocation,
}) => {
  const [startLocation, setStartLocation] = useState(startLocationProp);
  const [endLocation, setEndLocation] = useState(endLocationProp);
  const [deltaStart, setDeltaStart] = useState(0);

  useEffect(() => {
    setStartLocation(startLocationProp);
    setEndLocation(endLocationProp);
  }, [startLocationProp, endLocationProp]);

  // update animation dragger helper function
  const getAnimationLocateDateUpdate = (
    animLocationDate,
    animDraggerLocation,
    deltaX,
    { diffZeroValues, diffFactor },
  ) => {
    if (!diffZeroValues) { // month or year
      const options = timeScaleOptions[timeScale].timeAxis;
      const { gridWidth } = options;

      const startDraggerPositionRelativeToFrontDate = animDraggerLocation -
      position - transformX + deltaX;
      const gridWidthCoef = startDraggerPositionRelativeToFrontDate / gridWidth;
      const draggerDateAdded = moment.utc(frontDate).add(Math.floor(gridWidthCoef), timeScale);
      const draggerDateAddedValue = draggerDateAdded.valueOf();
      let daysCount;
      if (timeScale === 'year') {
        daysCount = draggerDateAdded.isLeapYear() ? 366 : 365;
      } else if (timeScale === 'month') {
        daysCount = draggerDateAdded.daysInMonth();
      }
      const gridWidthCoefRemainder = gridWidthCoef - Math.floor(gridWidthCoef);
      const remainderMilliseconds = daysCount * 86400000 * gridWidthCoefRemainder;
      const newLocationDate = draggerDateAddedValue + remainderMilliseconds;

      return new Date(newLocationDate);
    }
    const draggerTimeStartValue = new Date(animLocationDate).getTime();
    const newLocationDate = draggerTimeStartValue + (diffFactor * deltaX);
    return new Date(newLocationDate);
  };

  // handle animation dragger drag change
  const animationDraggerPositionUpdate = (draggerStartLocation, draggerEndLocation, isDragging) => {
    // calculate new start and end positions
    const deltaXStart = draggerStartLocation - startLocation;
    let animationStartLocationDate = startLocationDate;
    const deltaXEnd = draggerEndLocation - endLocation;
    let animationEndLocationDate = endLocationDate;

    const options = timeScaleOptions[timeScale].timeAxis;
    // if start or end dragger has moved
    if (deltaXStart !== 0 || deltaXEnd !== 0) {
      const diffZeroValues = options.scaleMs;
      // get startDate for diff calculation
      let diffFactor;
      if (diffZeroValues) {
        // month or year diffFactor is not static, so require calculation based on front date
        diffFactor = diffZeroValues / options.gridWidth; // else known diffFactor used
      }

      const sharedAnimLocationUpdateParams = {
        diffZeroValues,
        diffFactor,
      };

      if (deltaXStart !== 0) { // update new start date
        animationStartLocationDate = getAnimationLocateDateUpdate(
          animationStartLocationDate,
          startLocation,
          deltaXStart,
          sharedAnimLocationUpdateParams,
        );
      }
      if (deltaXEnd !== 0) { // update new end date
        animationEndLocationDate = getAnimationLocateDateUpdate(
          animationEndLocationDate,
          endLocation,
          deltaXEnd,
          sharedAnimLocationUpdateParams,
        );
      }
    }

    const startDateLimit = new Date(timelineStartDateLimit);
    const endDateLimit = new Date(timelineEndDateLimit);
    const startDate = new Date(animationStartLocationDate);
    const endDate = new Date(animationEndLocationDate);

    let newDraggerEndLocation = draggerEndLocation;
    let newDraggerStartLocation = draggerStartLocation;
    // prevent draggers to be dragger BEFORE start date limit
    if (endDate < startDateLimit) {
      newDraggerEndLocation = endLocation;
      animationEndLocationDate = startDateLimit;
    }
    if (startDate < startDateLimit) {
      newDraggerStartLocation = startLocation;
      animationStartLocationDate = startDateLimit;
    }
    // prevent draggers to be dragger AFTER end date limit
    if (endDate > endDateLimit) {
      newDraggerEndLocation = endLocation;
      animationEndLocationDate = endDateLimit;
    }
    if (startDate > endDateLimit) {
      newDraggerStartLocation = startLocation;
      animationStartLocationDate = endDateLimit;
    }
    updateAnimationDateAndLocation(
      animationStartLocationDate,
      animationEndLocationDate,
      newDraggerStartLocation,
      newDraggerEndLocation,
      isDragging,
    );
  };

  /*
   * When a child component is dragged,
   * this function is called to determine
   * the correct location for each of the
   * child elements after the drag
   *
   * @method handleDrag
   *
   * @param {number} deltaX - change in x
   * @param {string} id - Identifier used to
   *  distinguish between the child elements
   *
   * @return {void}
   */
  const onItemDrag = (deltaX, id) => {
    let startX;
    let endX;

    if (id === 'start') {
      startX = deltaX + startLocation;
      endX = endLocation;
      if (startX < 0 || startX > endX) {
        return;
      }
      if (startX + pinWidth >= endX) {
        if (startX + pinWidth >= max.width) {
          return;
        }
        endX = startX + pinWidth;
      }
    } else if (id === 'end') {
      startX = startLocation;
      endX = deltaX + endLocation;
      if (endX > max.width || startX > endX) {
        return;
      }
      if (startX + 2 * pinWidth >= endX) {
        startX = endX - pinWidth;
      }
    } else {
      startX = deltaX + startLocation;
      endX = deltaX + endLocation;
      if (endX >= max.width || startX < 0) {
        return;
      }
    }
    setStartLocation(startX);
    setEndLocation(endX);
    animationDraggerPositionUpdate(startX, endX, true);
  };

  /*
   * Send callback with new locations on
   * Drag Stop
   *
   * @method onDragStop
   *
   * @return {void}
   */
  const onDragStop = () => {
    animationDraggerPositionUpdate(startLocation, endLocation, false);
  };

  /*
   * Update state based on distance range was dragged
   *
   * @method onRangeDrag
   *
   * @param {number} d - change in x
   * @param {number} newDeltaStart - delta start to track changes
   *
   * @return {void}
   */
  const onRangeDrag = (d, newDeltaStart) => {
    const newStartLocation = startLocation + d;
    const newEndLocation = endLocation + d;
    setStartLocation((prev) => prev + d);
    setEndLocation((prev) => prev + d);
    setDeltaStart(newDeltaStart);
    animationDraggerPositionUpdate(newStartLocation, newEndLocation, true);
  };

  return (
    <svg
      id="wv-timeline-range-selector"
      className="wv-timeline-range-selector"
      width={axisWidth}
      height={75}
    >
      <DraggerRange
        opacity={rangeOpacity}
        startLocation={startLocation}
        endLocation={endLocation}
        startLocationDate={startLocationDate}
        endLocationDate={endLocationDate}
        timelineStartDateLimit={timelineStartDateLimit}
        timelineEndDateLimit={timelineEndDateLimit}
        timeScale={timeScale}
        deltaStart={deltaStart}
        max={max}
        height={64}
        width={pinWidth}
        color={rangeColor}
        draggerID="range-selector-range"
        onDrag={onRangeDrag}
        onStop={onDragStop}
        id="range"
      />
      <Dragger
        position={startLocation}
        color={startColor}
        width={pinWidth}
        height={45}
        onDrag={onItemDrag}
        onStop={onDragStop}
        max={max.width}
        draggerID="range-selector-dragger-1"
        backgroundColor={startTriangleColor}
        first
        id="start"
      />
      <Dragger
        max={max.width}
        position={endLocation}
        color={endColor}
        width={pinWidth}
        height={45}
        first={false}
        draggerID="range-selector-dragger-2"
        onDrag={onItemDrag}
        onStop={onDragStop}
        backgroundColor={endTriangleColor}
        id="end"
      />
    </svg>
  );
};

TimelineRangeSelector.propTypes = {
  axisWidth: PropTypes.number,
  endColor: PropTypes.string,
  endLocation: PropTypes.number,
  endLocationDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  endTriangleColor: PropTypes.string,
  frontDate: PropTypes.string,
  max: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  pinWidth: PropTypes.number,
  position: PropTypes.number,
  rangeColor: PropTypes.string,
  rangeOpacity: PropTypes.number,
  startColor: PropTypes.string,
  startLocation: PropTypes.number,
  startLocationDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  startTriangleColor: PropTypes.string,
  timelineEndDateLimit: PropTypes.string,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  transformX: PropTypes.number,
  updateAnimationDateAndLocation: PropTypes.func,
};

export default TimelineRangeSelector;
