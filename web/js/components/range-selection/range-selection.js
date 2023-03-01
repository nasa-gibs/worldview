import React from 'react';
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
class TimelineRangeSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      startLocation: props.startLocation,
      endLocation: props.endLocation,
      deltaStart: 0,
    };
  }

  componentDidMount() {
    this.updateLocation();
  }

  componentDidUpdate() {
    const { startLocation, endLocation } = this.props;
    // eslint-disable-next-line react/destructuring-assignment
    if (startLocation !== this.state.startLocation || endLocation !== this.state.endLocation) {
      this.updateLocation();
    }
  }

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
  onItemDrag = (deltaX, id) => {
    const { endLocation, startLocation } = this.state;
    const { max, pinWidth } = this.props;
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
    this.setState({
      startLocation: startX,
      endLocation: endX,
    });
    this.animationDraggerPositionUpdate(startX, endX, true);
  };

  /*
   * Send callback with new locations on
   * Drag Stop
   *
   * @method onDragStop
   *
   * @return {void}
   */
  onDragStop = () => {
    const { endLocation, startLocation } = this.state;
    this.animationDraggerPositionUpdate(startLocation, endLocation, false);
  };

  /*
   * Update state based on distance range was dragged
   *
   * @method onRangeDrag
   *
   * @param {number} d - change in x
   * @param {number} deltaStart - delta start to track changes
   *
   * @return {void}
   */
  onRangeDrag = (d, deltaStart) => {
    this.setState((prevState) => {
      const startLocation = prevState.startLocation + d;
      const endLocation = prevState.endLocation + d;
      this.animationDraggerPositionUpdate(startLocation, endLocation, true);
      return {
        startLocation: prevState.startLocation + d,
        endLocation: prevState.endLocation + d,
        deltaStart,
      };
    });
  };

  // update animation dragger helper function
  getAnimationLocateDateUpdate = (animLocationDate, animDraggerLocation, deltaX, { diffZeroValues, diffFactor }) => {
    if (!diffZeroValues) { // month or year
      const {
        timeScale,
        position,
        transformX,
        frontDate,
      } = this.props;

      const options = timeScaleOptions[timeScale].timeAxis;
      const { gridWidth } = options;

      const startDraggerPositionRelativeToFrontDate = animDraggerLocation - position - transformX + deltaX;
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
  animationDraggerPositionUpdate = (draggerStartLocation, draggerEndLocation, isDragging) => {
    const {
      timelineStartDateLimit,
      timelineEndDateLimit,
      startLocationDate,
      endLocationDate,
      timeScale,
      updateAnimationDateAndLocation,
    } = this.props;

    const {
      startLocation,
      endLocation,
    } = this.state;

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
      if (diffZeroValues) { // month or year diffFactor is not static, so require calculation based on front date
        diffFactor = diffZeroValues / options.gridWidth; // else known diffFactor used
      }

      const sharedAnimLocationUpdateParams = {
        diffZeroValues,
        diffFactor,
      };

      if (deltaXStart !== 0) { // update new start date
        animationStartLocationDate = this.getAnimationLocateDateUpdate(
          animationStartLocationDate,
          startLocation,
          deltaXStart,
          sharedAnimLocationUpdateParams,
        );
      }
      if (deltaXEnd !== 0) { // update new end date
        animationEndLocationDate = this.getAnimationLocateDateUpdate(
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

    // prevent draggers to be dragger BEFORE start date limit
    if (endDate < startDateLimit) {
      draggerEndLocation = endLocation;
      animationEndLocationDate = startDateLimit;
    }
    if (startDate < startDateLimit) {
      draggerStartLocation = startLocation;
      animationStartLocationDate = startDateLimit;
    }
    // prevent draggers to be dragger AFTER end date limit
    if (endDate > endDateLimit) {
      draggerEndLocation = endLocation;
      animationEndLocationDate = endDateLimit;
    }
    if (startDate > endDateLimit) {
      draggerStartLocation = startLocation;
      animationStartLocationDate = endDateLimit;
    }
    updateAnimationDateAndLocation(
      animationStartLocationDate,
      animationEndLocationDate,
      draggerStartLocation,
      draggerEndLocation,
      isDragging,
    );
  };

  updateLocation = () => {
    const { startLocation, endLocation } = this.props;
    this.setState({
      startLocation,
      endLocation,
    });
  };

  /*
   * @method render
   */
  render() {
    const { endLocation, deltaStart, startLocation } = this.state;
    const {
      axisWidth,
      endColor,
      endLocationDate,
      endTriangleColor,
      max,
      pinWidth,
      rangeColor,
      rangeOpacity,
      startColor,
      startLocationDate,
      startTriangleColor,
      timelineEndDateLimit,
      timelineStartDateLimit,
      timeScale,
    } = this.props;
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
          onDrag={this.onRangeDrag}
          onStop={this.onDragStop}
          id="range"
        />
        <Dragger
          position={startLocation}
          color={startColor}
          width={pinWidth}
          height={45}
          onDrag={this.onItemDrag}
          onStop={this.onDragStop}
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
          onDrag={this.onItemDrag}
          onStop={this.onDragStop}
          backgroundColor={endTriangleColor}
          id="end"
        />
      </svg>
    );
  }
}

TimelineRangeSelector.defaultProps = {
  pinWidth: 5,
  rangeOpacity: 0.3,
  rangeColor: '#45bdff',
  startColor: '#40a9db',
  startTriangleColor: '#fff',
  endColor: '#295f92',
  endTriangleColor: '#4b7aab',
};

TimelineRangeSelector.propTypes = {
  axisWidth: PropTypes.number,
  endColor: PropTypes.string,
  endLocation: PropTypes.number,
  endLocationDate: PropTypes.object,
  endTriangleColor: PropTypes.string,
  frontDate: PropTypes.string,
  max: PropTypes.object,
  pinWidth: PropTypes.number,
  position: PropTypes.number,
  rangeColor: PropTypes.string,
  rangeOpacity: PropTypes.number,
  startColor: PropTypes.string,
  startLocation: PropTypes.number,
  startLocationDate: PropTypes.object,
  startTriangleColor: PropTypes.string,
  timelineEndDateLimit: PropTypes.string,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  transformX: PropTypes.number,
  updateAnimationDateAndLocation: PropTypes.func,
};

export default TimelineRangeSelector;
