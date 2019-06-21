import React from 'react';
import PropTypes from 'prop-types';
import Dragger from './dragger.js';
import DraggerRange from './dragger-range.js';
import googleTagManager from 'googleTagManager';

import moment from 'moment';
import { timeScaleOptions } from '../../modules/date/constants';
/*
 * A react component, is a draggable svg
 * group. It is a parent component that
 * rerenders when child elements are dragged
 *
 * @class TimelineRangeSelector
 */
class TimelineRangeSelector extends React.Component {
  /*
   * @constructor
   */
  constructor(props) {
    super(props);
    this.state = {
      startLocation: props.startLocation,
      endLocation: props.endLocation,
      deltaStart: 0
    };

    this.onRangeDrag = this.onRangeDrag.bind(this);
    this.onItemDrag = this.onItemDrag.bind(this);
    this.onDragStop = this.onDragStop.bind(this);
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
  onItemDrag(deltaX, id) {
    var startX;
    var endX;

    if (id === 'start') {
      startX = deltaX + this.state.startLocation;
      endX = this.state.endLocation;
      if (startX < 0 || startX > endX) {
        return;
      }
      if (startX + this.props.pinWidth >= endX) {
        if (startX + this.props.pinWidth >= this.props.max.width) {
          return;
        } else {
          endX = startX + this.props.pinWidth;
        }
      }
    } else if (id === 'end') {
      startX = this.state.startLocation;
      endX = deltaX + this.state.endLocation;
      if (endX > this.props.max.width || startX > endX) {
        return;
      }
      if (startX + 2 * this.props.pinWidth >= endX) {
        startX = endX - this.props.pinWidth;
      }
    } else {
      startX = deltaX + this.state.startLocation;
      endX = deltaX + this.state.endLocation;
      if (endX >= this.props.max.width || startX < 0) {
        return;
      }
    }
    this.setState({
      startLocation: startX,
      endLocation: endX
    });
    this.animationDraggerPositionUpdate(startX, endX, true);
  }
  /*
   * Send callback with new locations on
   * Drag Stop
   *
   * @method onDragStop
   *
   * @return {void}
   */
  onDragStop() {
    this.animationDraggerPositionUpdate(this.state.startLocation, this.state.endLocation, false);
    googleTagManager.pushEvent({
      event: 'GIF_animation_dragger'
    });
  }
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
  onRangeDrag(d, deltaStart) {
    let startLocation = this.state.startLocation + d;
    let endLocation = this.state.endLocation + d;
    this.setState({
      startLocation: startLocation,
      endLocation: endLocation,
      deltaStart: deltaStart
    });
    this.animationDraggerPositionUpdate(startLocation, endLocation, true);
  }

  // update animation dragger helper function
  getAnimationLocateDateUpdate = (animLocationDate, animDraggerLocation, deltaX, { diffZeroValues, diffFactor }) => {
    if (!diffZeroValues) { // month or year
      let {
        timeScale,
        position,
        transformX
      } = this.props;

      let options = timeScaleOptions[timeScale].timeAxis;
      let gridWidth = options.gridWidth;

      let startDraggerPositionRelativeToFrontDate = animDraggerLocation - position - transformX + deltaX;
      let gridWidthCoef = startDraggerPositionRelativeToFrontDate / gridWidth;
      let draggerDateAdded = moment.utc(this.props.frontDate).add((Math.floor(gridWidthCoef)), timeScale);
      let draggerDateAddedValue = draggerDateAdded.valueOf();
      let daysCount;
      if (timeScale === 'year') {
        daysCount = draggerDateAdded.isLeapYear() ? 366 : 365;
      } else if (timeScale === 'month') {
        daysCount = draggerDateAdded.daysInMonth();
      }
      let gridWidthCoefRemainder = gridWidthCoef - Math.floor(gridWidthCoef);
      let remainderMilliseconds = daysCount * 86400000 * gridWidthCoefRemainder;
      let newLocationDate = draggerDateAddedValue + remainderMilliseconds;

      return new Date(newLocationDate);
    } else {
      let draggerTimeStartValue = new Date(animLocationDate).getTime();
      let newLocationDate = draggerTimeStartValue + (diffFactor * deltaX);
      return new Date(newLocationDate);
    }
  }

  // handle animation dragger drag change
  animationDraggerPositionUpdate = (draggerStartLocation, draggerEndLocation, isDragging) => {
    let {
      timelineStartDateLimit,
      timelineEndDateLimit,
      startLocationDate,
      endLocationDate,
      timeScale
    } = this.props;

    let {
      startLocation,
      endLocation
    } = this.state;

    // calculate new start and end positions
    let deltaXStart = draggerStartLocation - startLocation;
    let animationStartLocationDate = startLocationDate;
    let deltaXEnd = draggerEndLocation - endLocation;
    let animationEndLocationDate = endLocationDate;

    let options = timeScaleOptions[timeScale].timeAxis;
    // if start or end dragger has moved
    if (deltaXStart !== 0 || deltaXEnd !== 0) {
      let diffZeroValues = options.scaleMs;
      // get startDate for diff calculation
      let diffFactor;
      if (diffZeroValues) { // month or year diffFactor is not static, so require calculation based on front date
        diffFactor = diffZeroValues / options.gridWidth; // else known diffFactor used
      }

      let sharedAnimLocationUpdateParams = {
        diffZeroValues,
        diffFactor
      };

      if (deltaXStart !== 0) { // update new start date
        animationStartLocationDate = this.getAnimationLocateDateUpdate(
          animationStartLocationDate,
          startLocation,
          deltaXStart,
          sharedAnimLocationUpdateParams
        );
      }
      if (deltaXEnd !== 0) { // update new end date
        animationEndLocationDate = this.getAnimationLocateDateUpdate(
          animationEndLocationDate,
          endLocation,
          deltaXEnd,
          sharedAnimLocationUpdateParams
        );
      }
    }

    let startDateLimit = new Date(timelineStartDateLimit);
    let endDateLimit = new Date(timelineEndDateLimit);
    let startDate = new Date(animationStartLocationDate);
    let endDate = new Date(animationEndLocationDate);

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
    this.props.updateAnimationDateAndLocation(
      animationStartLocationDate,
      animationEndLocationDate,
      draggerStartLocation,
      draggerEndLocation,
      isDragging
    );
  }

  componentDidMount() {
    this.updateLocation();
  }

  updateLocation = () => {
    this.setState({
      startLocation: this.props.startLocation,
      endLocation: this.props.endLocation
    });
  }

  componentDidUpdate() {
    let { startLocation, endLocation } = this.props;
    if (startLocation !== this.state.startLocation || endLocation !== this.state.endLocation) {
      this.updateLocation();
    }
  }

  /*
   * @method render
   */
  render() {
    return (
      <svg
        id="wv-timeline-range-selector"
        className="wv-timeline-range-selector"
        width={this.props.width}
        height={75}
        style={{
          left: this.props.parentOffset
        }}
      >
        <DraggerRange
          opacity={this.props.rangeOpacity}
          startLocation={this.state.startLocation}
          endLocation={this.state.endLocation}
          startLocationDate={this.props.startLocationDate}
          endLocationDate={this.props.endLocationDate}
          timelineStartDateLimit={this.props.timelineStartDateLimit}
          timelineEndDateLimit={this.props.timelineEndDateLimit}
          deltaStart={this.state.deltaStart}
          max={this.props.max}
          height={64}
          width={this.props.pinWidth}
          color={this.props.rangeColor}
          draggerID="range-selector-range"
          onDrag={this.onRangeDrag}
          onStop={this.onDragStop}
          id="range"
        />
        <Dragger
          position={this.state.startLocation}
          color={this.props.startColor}
          width={this.props.pinWidth}
          height={45}
          onDrag={this.onItemDrag}
          onStop={this.onDragStop}
          max={this.props.max.width}
          draggerID="range-selector-dragger-1"
          backgroundColor={this.props.startTriangleColor}
          first={true}
          id="start"
        />
        <Dragger
          max={this.props.max.width}
          position={this.state.endLocation}
          color={this.props.endColor}
          width={this.props.pinWidth}
          height={45}
          first={false}
          draggerID="range-selector-dragger-2"
          onDrag={this.onItemDrag}
          onStop={this.onDragStop}
          backgroundColor={this.props.endTriangleColor}
          id="end"
        />
      </svg>
    );
  }
}

TimelineRangeSelector.propTypes = {
  updateAnimationDateAndLocation: PropTypes.func,
  width: PropTypes.number,
  parentOffset: PropTypes.number,
  timeScale: PropTypes.string,
  frontDate: PropTypes.string,
  position: PropTypes.number,
  transformX: PropTypes.number,
  startLocation: PropTypes.number,
  endLocation: PropTypes.number,
  startLocationDate: PropTypes.object,
  endLocationDate: PropTypes.object,
  timelineStartDateLimit: PropTypes.string,
  timelineEndDateLimit: PropTypes.string,
  max: PropTypes.object,
  pinWidth: PropTypes.number,
  onDrag: PropTypes.func,
  rangeOpacity: PropTypes.number,
  rangeColor: PropTypes.string,
  startColor: PropTypes.string,
  startTriangleColor: PropTypes.string,
  endColor: PropTypes.string,
  endTriangleColor: PropTypes.string
};

export default TimelineRangeSelector;
