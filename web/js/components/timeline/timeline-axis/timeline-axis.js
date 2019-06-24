import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import moment from 'moment';

import GridRange from './grid-range/grid-range';

import { getTimeRange } from './date-calc';
import {
  timeScaleOptions,
  timeScaleToNumberKey
} from '../../../modules/date/constants';
import {
  getIsBetween,
  removeBackMultipleInPlace,
  removeFrontMultipleInPlace
} from '../date-util';

class TimelineAxis extends Component {
  constructor(props) {
    super(props);
    this.state = {
      init: true,
      draggerWidth: 49,
      dragSentinelCount: 0,
      currentTimeRange: null,
      gridWidth: 12,
      wheelZoom: false,
      mouseDown: false
    };
    // axis
    this.handleDrag = this.handleDrag.bind(this);
    this.handleStartDrag = this.handleStartDrag.bind(this);
    this.handleStopDrag = this.handleStopDrag.bind(this);
    this.handleWheel = this.handleWheel.bind(this);

    // axis click to set dragger
    this.setLineTime = this.setLineTime.bind(this);

    // wheel event timeout
    this.wheelTimeout = 0;
  }

  /**
  * @desc main function to update axis scale, time range, grids tiles/text, draggerA/B positions, animation start/end draggers
  * @param {String} inputDate
  * @param {String} timeScale
  * @param {Number} axisWidthInput
  * @param {Number} leftOffsetFixedCoeff
  * @param {Boolean} hoverChange
  * @returns {void}
  */
  updateScale = (inputDate, timeScale, axisWidthInput, leftOffsetFixedCoeff, hoverChange) => {
    // console.log(inputDate, timeScale, axisWidthInput, leftOffsetFixedCoeff, hoverChange)
    let minDateTimelineStartDateLimit = this.props.timelineStartDateLimit;
    let maxDateTimelineEndDateLimit = this.props.timelineEndDateLimit;
    let options = timeScaleOptions[timeScale].timeAxis;
    let gridWidth = options.gridWidth;
    let axisWidth = axisWidthInput || this.props.axisWidth;
    let leftOffset = leftOffsetFixedCoeff ? axisWidth * leftOffsetFixedCoeff : this.props.leftOffset;

    if (leftOffset === 0) {
      leftOffset = axisWidth * 0.75;
    }

    let numberOfVisibleTiles = Number((axisWidth / gridWidth).toFixed(8));
    let gridNumber = Math.floor(numberOfVisibleTiles * 1.5); // should get from state?
    let dragSentinelChangeNumber = gridWidth * (Math.floor(numberOfVisibleTiles * 0.25) + 1);
    if (timeScale === 'year') {
      let endLimitYear = moment.utc(this.props.timelineEndDateLimit).year() + 1;
      let startLimitYear = moment.utc(this.props.timelineStartDateLimit).year();
      gridNumber = endLimitYear - startLimitYear;
      numberOfVisibleTiles = gridNumber;
    }

    // Floating point issues need to be handled more cleanly
    let midPoint = -((gridWidth * gridNumber) / 2) + ((numberOfVisibleTiles / 2) * gridWidth);
    // horizontal scroll will disable this, so use frontDate in that case
    let hoverTime = moment.utc(this.props.hoverTime || this.props.frontDate);

    // handle timeline axis start/end limits
    let isBeforeStart = new Date(hoverTime) <= new Date(minDateTimelineStartDateLimit);
    if (isBeforeStart) {
      hoverTime = moment.utc(minDateTimelineStartDateLimit);
    } else {
      let isAfterEnd = new Date(hoverTime) >= new Date(maxDateTimelineEndDateLimit);
      if (isAfterEnd) {
        hoverTime = moment.utc(maxDateTimelineEndDateLimit);
      }
    }

    // use input date or hoverTime
    hoverTime = inputDate ? moment.utc(inputDate) : hoverTime;
    let hoverTimeZero = hoverTime.clone().startOf(timeScale);
    if (timeScale === 'year') {
      hoverTimeZero = moment.utc(this.props.timelineStartDateLimit);
    }
    let hoverTimeNextZero = hoverTimeZero.clone().add(1, timeScale);

    let draggerDateActual;
    let draggerDateActualB;
    if (this.props.draggerSelected === 'selected') {
      draggerDateActual = hoverChange ? this.props.draggerTimeState : inputDate || this.props.draggerTimeState;
      draggerDateActualB = this.props.draggerTimeStateB;
    } else {
      draggerDateActual = this.props.draggerTimeState;
      draggerDateActualB = hoverChange ? this.props.draggerTimeStateB : inputDate || this.props.draggerTimeStateB;
    }

    // value of hover time, hover time timeunit zeroed, hover time next unit timeunit zeroed
    let hoverTimeValue = hoverTime.valueOf();
    let hoverTimeZeroValue = hoverTimeZero.valueOf();
    let hoverTimeNextZeroValue = hoverTimeNextZero.valueOf();

    let diffZeroValues = hoverTimeNextZeroValue - hoverTimeZeroValue;
    let diffFactor = diffZeroValues / gridWidth;
    let diffStartAndZeroed = hoverTimeValue - hoverTimeZeroValue;

    let pixelsToAdd = diffStartAndZeroed / diffFactor;

    // offset grids needed since each zoom in won't be centered
    let offSetGrids = Math.floor(leftOffset / gridWidth);
    let offSetGridsDiff = offSetGrids - Math.floor(numberOfVisibleTiles / 2);

    let gridsToSubtract = Math.floor(gridNumber / 2) + offSetGridsDiff;
    let gridsToAdd = Math.floor(gridNumber / 2) - offSetGridsDiff;

    let timeRange = this.getTimeRangeArray(gridsToSubtract, gridsToAdd, hoverTime);

    // get front and back dates
    let frontDate = moment.utc(timeRange[0].rawDate);
    let backDate = timeRange[timeRange.length - 1].rawDate;
    // check if dragger date is between front/back dates, null set to ignore granularity (go to ms), [] for inclusive of front/back dates

    let draggerPosition = 0;
    let draggerVisible = false;
    let isBetween = getIsBetween(draggerDateActual, frontDate, backDate);
    if (isBetween) {
      draggerPosition = Math.abs(frontDate.diff(draggerDateActual, timeScale, true) * gridWidth);
      if (this.props.isCompareModeActive || this.props.draggerSelected === 'selected') {
        draggerVisible = true;
      }
    }

    let draggerPositionB = 0;
    let draggerVisibleB = false;
    let isBetweenB = getIsBetween(draggerDateActualB, frontDate, backDate);
    if (isBetweenB) {
      draggerPositionB = Math.abs(frontDate.diff(draggerDateActualB, timeScale, true) * gridWidth);
      if (this.props.isCompareModeActive || this.props.draggerSelected === 'selectedB') {
        draggerVisibleB = true;
      }
    }
    let position;
    // axisWidthInput conditional in place to handle resize centering of position
    if (axisWidthInput) {
      position = midPoint;
    } else {
      //  - (offSetGridsDiff * gridWidth) to compensate off center zooming repositioning
      position = +(midPoint - (axisWidth / 2 - leftOffset)).toFixed(10) - (offSetGridsDiff * gridWidth);
      if (gridNumber % 2 !== 0) { // handle odd number gridNumber grid offset
        position += gridWidth / 2;
      }
    }

    if (timeScale === 'year') {
      position = 0 + axisWidth / 2 + (leftOffset - axisWidth / 2);
    }

    // update animation draggers
    let animationStartDraggerLocation;
    let animationEndDraggerLocation;

    if (this.props.animStartLocationDate) {
      animationStartDraggerLocation = moment.utc(this.props.animStartLocationDate).diff(frontDate, timeScale, true) * gridWidth;
      animationEndDraggerLocation = moment.utc(this.props.animEndLocationDate).diff(frontDate, timeScale, true) * gridWidth;
    }

    // get axis bounds
    let timelineStartDateLimit = this.props.timelineStartDateLimit;
    let timelineEndDateLimit = this.props.timelineEndDateLimit;
    let diffFromStartDateLimit = hoverTime.diff(timelineStartDateLimit, timeScale);
    let leftBound = frontDate.diff(timelineEndDateLimit, timeScale) * gridWidth + (midPoint * 1.5) + axisWidth;
    let rightBound = (diffFromStartDateLimit * gridWidth) + (midPoint * 1.5);
    rightBound = rightBound < position ? position : rightBound;

    let transformX = -pixelsToAdd - 2;
    let animationStartLocation = animationStartDraggerLocation + position - pixelsToAdd - 2;
    let animationEndLocation = animationEndDraggerLocation + position - pixelsToAdd - 2;

    draggerPosition = draggerPosition - pixelsToAdd + position - this.state.draggerWidth;
    draggerPositionB = draggerPositionB - pixelsToAdd + position - this.state.draggerWidth;

    let updatePositioningArguments = {
      hasMoved: false,
      isTimelineDragging: false,
      position,
      transformX,
      frontDate: timeRange[0].rawDate,
      backDate,
      draggerPosition,
      draggerPositionB,
      draggerVisible,
      draggerVisibleB,
      animationStartLocation,
      animationEndLocation
    };

    this.setState({
      init: false,
      currentTimeRange: timeRange,
      gridNumber,
      gridWidth,
      numberOfVisibleTiles,
      dragSentinelChangeNumber,
      midPoint: position,
      dragSentinelCount: 0,
      leftBound,
      rightBound,
      wheelZoom: false
    }, this.props.updatePositioning(updatePositioningArguments));
  }

  /**
  * @desc update dates in range based on dragging axis
  * @param {Number} subtract - integer (negative numbers selects start date in the future)
  * @param {Number} add - integer (negative numbers selects end date in the past)
  * @param {string} inputDate
  * @returns {Array} timeRangeArray - time range
  */
  getTimeRangeArray = (subtract, add, inputDate) => {
    let {
      timelineEndDateLimit,
      timelineStartDateLimit,
      timeScale
    } = this.props;
    let dayZeroed;
    let startDate;
    let endDate;

    if (timeScale === 'year') {
      dayZeroed = moment.utc(inputDate).startOf('year');
      let endLimitYear = new Date(timelineEndDateLimit).getUTCFullYear() + 1;
      let startLimitYear = new Date(timelineStartDateLimit).getUTCFullYear();
      startDate = dayZeroed.year(startLimitYear);
      endDate = dayZeroed.clone().year(endLimitYear);
    } else {
      if (timeScale === 'month') {
        dayZeroed = moment.utc(inputDate).startOf('month');
      } else if (timeScale === 'day') {
        dayZeroed = moment.utc(inputDate).startOf('day');
      } else if (timeScale === 'hour') {
        dayZeroed = moment.utc(inputDate).startOf('hour');
      } else if (timeScale === 'minute') {
        dayZeroed = moment.utc(inputDate).startOf('minute');
      }
      startDate = dayZeroed.clone().subtract(subtract, timeScale);
      endDate = dayZeroed.clone().add(add, timeScale);
    }
    let timeRangeArray = getTimeRange(
      startDate,
      endDate,
      timeScale,
      timelineStartDateLimit,
      timelineEndDateLimit);
    return timeRangeArray;
  }

  /**
  * @desc update dates in range based on dragging axis
  * @param {Number} position
  * @param {Number} deltaX
  * @param {Number} draggerPosition
  * @param {Number} draggerPositionB
  * @param {Number} overDrag
  * @returns {Object} output - return new time range and dragger visibilty/updated position
  * @returns {Array} output.currentTimeRange
  * @returns {Number} output.transformX
  * @returns {Boolean} output.draggerVisible
  * @returns {Boolean} output.draggerVisibleB
  * @returns {Number} output.overDragGrids
  * @returns {Number} output.newDraggerPosition
  * @returns {Number} output.newDraggerPositionB
  */
  updateTimeRangeFromDrag = (position, deltaX, draggerPosition, draggerPositionB, overDrag) => {
    let {
      gridWidth,
      currentTimeRange,
      numberOfVisibleTiles
    } = this.state;

    let {
      transformX,
      draggerVisible,
      draggerVisibleB,
      draggerTimeState,
      draggerTimeStateB,
      isCompareModeActive,
      draggerSelected
    } = this.props;
    numberOfVisibleTiles = Math.floor(numberOfVisibleTiles * 0.25);
    let overDragGrids = Math.ceil(overDrag / gridWidth);
    let timeRangeAdd;
    let transform;
    if (deltaX > 0) { // dragging right - exposing past dates
      let firstDateInRange = currentTimeRange[0].rawDate;
      timeRangeAdd = this.getTimeRangeArray(numberOfVisibleTiles + 1 + overDragGrids, -1, firstDateInRange);
      removeBackMultipleInPlace(currentTimeRange, numberOfVisibleTiles + 1 + overDragGrids);
      currentTimeRange.unshift(...timeRangeAdd);
      transform = transformX - (numberOfVisibleTiles + 1 + overDragGrids) * gridWidth;
    } else { // dragging left - exposing future dates
      let lastDateInRange = currentTimeRange[currentTimeRange.length - 1].rawDate;
      timeRangeAdd = this.getTimeRangeArray(-1, numberOfVisibleTiles + 1 + overDragGrids, lastDateInRange);
      removeFrontMultipleInPlace(currentTimeRange, numberOfVisibleTiles + 1 + overDragGrids);
      currentTimeRange.push(...timeRangeAdd);
      transform = transformX + (numberOfVisibleTiles + 1 + overDragGrids) * gridWidth;
    }

    // check if dragger is in between range and visible
    let frontDate = currentTimeRange[0].rawDate;
    let backDate = currentTimeRange[currentTimeRange.length - 1].rawDate;

    // default to input dragger positions in the event of no updates
    let newDraggerPosition = draggerPosition;
    let newDraggerPositionB = draggerPositionB;

    let sharedDraggerVisibilityParams = {
      frontDate,
      backDate,
      position,
      transform
    };

    // check selected dragger (or both if compare mode) for visibility and new position
    if (draggerSelected === 'selected' || isCompareModeActive) { // dragger A selected
      let draggerACheck = this.checkDraggerVisibility(
        draggerTimeState,
        draggerVisible,
        newDraggerPosition,
        sharedDraggerVisibilityParams
      );
      draggerVisible = draggerACheck.isVisible;
      newDraggerPosition = draggerACheck.newDraggerPosition;
    }

    if (draggerSelected === 'selectedB' || isCompareModeActive) { // dragger B selected
      let draggerBCheck = this.checkDraggerVisibility(
        draggerTimeStateB,
        draggerVisibleB,
        newDraggerPositionB,
        sharedDraggerVisibilityParams
      );
      draggerVisibleB = draggerBCheck.isVisible;
      newDraggerPositionB = draggerBCheck.newDraggerPosition;
    }

    return {
      currentTimeRange,
      transformX: transform,
      draggerVisible,
      draggerVisibleB,
      overDragGrids,
      newDraggerPosition,
      newDraggerPositionB
    };
  }

  /**
  * @desc helper function used in updateTimeRangeFromDrag
  * @desc check dragger visibility and calculate newDraggerPosition if dragger initially false and now visible
  * @param {String} draggerTime
  * @param {Boolean} draggerVisible
  * @param {Number} newDraggerPosition
  * @param {Object} sharedDraggerVisibilityParams
  * @param {Object} sharedDraggerVisibilityParams.frontDate
  * @param {String} sharedDraggerVisibilityParams.backDate
  * @param {Number} sharedDraggerVisibilityParams.position
  * @param {Number} sharedDraggerVisibilityParams.transform
  * @returns {Object} output - return params used for dragger visibilty/updating dragger position
  * @returns {Boolean} output.newDraggerPosition
  * @returns {Boolean} output.isVisible - dragger within visible range
  */
  checkDraggerVisibility = (draggerTime, draggerVisible, newDraggerPosition, { frontDate, backDate, position, transform }) => {
    let { gridWidth } = this.state;
    let { timeScale } = this.props;
    let isBetween = getIsBetween(draggerTime, frontDate, backDate);
    if (isBetween) {
      if (draggerVisible === false) {
        let frontDateObj = moment.utc(frontDate);
        newDraggerPosition = Math.abs(frontDateObj.diff(draggerTime, timeScale, true) * gridWidth) + position + transform - 50;
      }
      return {
        newDraggerPosition,
        isVisible: true
      };
    } else {
      return {
        newDraggerPosition,
        isVisible: false
      };
    }
  }

  componentDidMount() {
    let time = this.props.draggerSelected === 'selected' ? this.props.dateA : this.props.dateB;
    this.updateScale(time, this.props.timeScale, this.props.axisWidth, 0.80);
  }

  componentDidUpdate(prevProps, prevState) {
    let {
      dateA,
      dateB,
      draggerSelected,
      isDraggerDragging,
      timeScale,
      axisWidth,
      isCompareModeActive,
      draggerTimeState,
      draggerTimeStateB
    } = this.props;

    // update timescale axis focus
    if (timeScale !== prevProps.timeScale) {
      let draggerDate;
      let leftOffset;
      if (this.state.wheelZoom === true) {
        draggerDate = this.props.hoverTime;
      } else {
        leftOffset = 0.75;
        if (draggerSelected === 'selected') {
          draggerDate = draggerTimeState;
        } else {
          draggerDate = draggerTimeStateB;
        }
      }
      this.updateScale(draggerDate, timeScale, null, leftOffset, true);
    }

    // update axis on browser width change
    if (axisWidth !== prevProps.axisWidth) {
      let draggerDate;
      if (draggerSelected === 'selected') {
        draggerDate = draggerTimeState;
      } else {
        draggerDate = draggerTimeStateB;
      }
      this.updateScale(draggerDate, timeScale, axisWidth);
    }

    // handle switching A/B dragger axis focus if switched from A/B sidebar tabs
    if (isCompareModeActive && (draggerSelected !== prevProps.draggerSelected)) {
      if (draggerSelected === 'selected') {
        let draggerCheck = this.checkDraggerMoveOrUpdateScale(dateA);
        if (!draggerCheck.withinRange) {
          this.updateScaleWithOffset(dateA, timeScale, draggerCheck);
        }
      } else {
        let draggerCheck = this.checkDraggerMoveOrUpdateScale(dateB, true);
        if (!draggerCheck.withinRange) {
          this.updateScaleWithOffset(dateB, timeScale, draggerCheck);
        }
      }
    }

    if (!isDraggerDragging) {
      // handle A dragger change
      if (draggerTimeState !== dateA || prevProps.dateA !== dateA) {
        // check if draggerCheck will be within acceptable visible axis width
        let draggerCheck = this.checkDraggerMoveOrUpdateScale(dateA);
        if (!draggerCheck.withinRange) {
          this.updateScaleWithOffset(dateA, timeScale, draggerCheck);
        }
      }

      // handle B dragger change
      if (draggerTimeStateB !== dateB || prevProps.dateB !== dateB) {
        // check if draggerCheck will be within acceptable visible axis width
        let draggerCheck = this.checkDraggerMoveOrUpdateScale(dateB, true);
        if (!draggerCheck.withinRange) {
          this.updateScaleWithOffset(dateB, timeScale, draggerCheck);
        }
      }
    }
  }

  /**
   * @desc check if selectedDate will be within acceptable visible axis width
   * @param {String} selectedDate
   * @param {Boolean} draggerB - draggerB being checked?
   * @returns {Object} output - return params used for dragger visibilty/updating axis
   * @returns {Boolean} output.withinRange - within visible range
   * @returns {Boolean} output.newDateInThePast - new date older?
   * @returns {Number} output.newDraggerDiff - difference of new dragger from selected
   */
  checkDraggerMoveOrUpdateScale = (selectedDate, draggerB) => {
    let draggerTimeState;
    let draggerPosition;

    if (draggerB) {
      draggerTimeState = this.props.draggerTimeStateB;
      draggerPosition = this.props.draggerPositionB;
    } else {
      draggerTimeState = this.props.draggerTimeState;
      draggerPosition = this.props.draggerPosition;
    }

    let timeScale = this.props.timeScale;
    let gridWidth = this.state.gridWidth;
    let axisWidth = this.props.axisWidth;

    let selectedDateMoment = moment.utc(selectedDate);
    let draggerDateMoment = moment.utc(draggerTimeState);

    let newDraggerDiff = selectedDateMoment.diff(draggerDateMoment, timeScale, true);
    let newDraggerPosition = draggerPosition + (newDraggerDiff * gridWidth);
    let newDateInThePast = selectedDateMoment < draggerDateMoment;
    let newDraggerWithinRangeCheck = newDraggerPosition <= (axisWidth - 80) && newDraggerPosition >= -26;

    return {
      withinRange: newDraggerWithinRangeCheck,
      newDateInThePast: newDateInThePast,
      newDraggerDiff: Math.abs(newDraggerDiff)
    };
  }

  /**
  * @desc helper used in componentDidUpdate
  * @desc update scale leftOffset
  * @param {String} date
  * @param {String} timeScale
  * @param {Object} draggerCheck
  * @returns {void}
  */
  updateScaleWithOffset = (date, timeScale, draggerCheck) => {
    let leftOffsetFixedCoeff = draggerCheck.newDraggerDiff > 5 ? 0.5 : draggerCheck.newDateInThePast ? 0.25 : 0.75;
    this.updateScale(date, timeScale, null, leftOffsetFixedCoeff);
  }

  // #### Drag/mouse handlers ####
  /**
  * @desc show hover line - additional parent conditons required
  * @param {Event} mouse event
  * @returns {void}
  */
  showHoverOn = (e) => {
    if (!this.props.isAnimationDraggerDragging && !this.props.isTimelineDragging) {
      if (e.target.className.animVal === 'axis-grid-rect') {
        this.props.showHoverOn();
      }
    }
  }

  /**
  * @desc changes timeScale with wheel scroll
  * y axis change - change timescale (e.g. from 'day' to 'month')
  * x axis change - horizontal scroll multi-touch
  * @param {Event} wheel scroll event
  * @returns {void}
  */
  handleWheel(e) {
    let { timeScale, hasSubdailyLayers, changeTimeScale } = this.props;
    let timeScaleNumber = Number(timeScaleToNumberKey[timeScale]);
    let maxTimeScaleNumber = hasSubdailyLayers ? 5 : 3;

    // handle time scale change on y axis wheel event
    if (e.deltaY !== 0) {
      if (e.deltaY > 0) { // wheel zoom out
        if (timeScaleNumber > 1) {
          this.setState({
            wheelZoom: true
          }, changeTimeScale(timeScaleNumber - 1));
        }
      } else {
        if (timeScaleNumber < maxTimeScaleNumber) { // wheel zoom in
          this.setState({
            wheelZoom: true
          }, changeTimeScale(timeScaleNumber + 1));
        }
      }
    }
    // handle horizontal scroll on x axis wheel event
    if (e.deltaX !== 0) {
      this.handleStartDrag();
      if (e.deltaX > 0) { // mutli-touch drag left
        let scrollX = this.props.position - 100;
        if (scrollX < this.state.leftBound) { // cancel drag if exceeds axis leftBound
          clearTimeout(this.wheelTimeout);
          let updatePositioningArguments = {
            hasMoved: false,
            isTimelineDragging: false,
            position: this.props.position,
            transformX: this.props.transformX,
            frontDate: this.props.frontDate,
            backDate: this.props.backDate,
            draggerPosition: this.props.draggerPosition,
            draggerPositionB: this.props.draggerPositionB,
            draggerVisible: this.props.draggerVisible,
            draggerVisibleB: this.props.draggerVisibleB,
            animationStartLocation: this.props.animationStartLocation,
            animationEndLocation: this.props.animationEndLocation
          };
          let hoverTime = null;
          this.props.updatePositioning(updatePositioningArguments, hoverTime);
        } else {
          let deltaObj = {
            deltaX: -100,
            x: scrollX
          };
          this.handleDrag(e, deltaObj);
          clearTimeout(this.wheelTimeout);
          this.wheelTimeout = setTimeout(() => {
            this.handleStopDrag(null, deltaObj);
          }, 100);
        }
      } else { // multi-touch drag right
        let scrollX = this.props.position + 100;
        if (scrollX > this.state.rightBound) { // cancel drag if exceeds axis rightBound
          clearTimeout(this.wheelTimeout);
          let updatePositioningArguments = {
            hasMoved: false,
            isTimelineDragging: false,
            position: this.props.position,
            transformX: this.props.transformX,
            frontDate: this.props.frontDate,
            backDate: this.props.backDate,
            draggerPosition: this.props.draggerPosition,
            draggerPositionB: this.props.draggerPositionB,
            draggerVisible: this.props.draggerVisible,
            draggerVisibleB: this.props.draggerVisibleB,
            animationStartLocation: this.props.animationStartLocation,
            animationEndLocation: this.props.animationEndLocation
          };
          let hoverTime = null;
          this.props.updatePositioning(updatePositioningArguments, hoverTime);
        } else {
          let deltaObj = {
            deltaX: 100,
            x: scrollX
          };
          this.handleDrag(e, deltaObj);
          clearTimeout(this.wheelTimeout);
          this.wheelTimeout = setTimeout(() => {
            this.handleStopDrag(null, deltaObj);
          }, 100);
        }
      }
    }
  }

  /**
  * @desc set mouseDown to handle over dragging range-select and triggering false axis click
  * @returns {void}
  */
  handleMouseDown = (e) => {
    this.setState({
      mouseDown: true
    });
  }

  /**
  * @desc move dragger on axis click - calculated based on hover
  * @param {Event} mouse click event
  * @returns {void}
  */
  setLineTime = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.className.animVal !== 'axis-grid-rect') {
      return;
    }
    if (!this.props.isAnimationDraggerDragging &&
        !this.props.hasMoved &&
        (this.state.mouseDown || e.type === 'touchend')) {
      let {
        currentTimeRange
      } = this.state;
      let {
        isCompareModeActive,
        draggerSelected,
        draggerTimeState,
        draggerTimeStateB,
        hoverTime
      } = this.props;
      // get front and back dates
      let frontDate = currentTimeRange[0].rawDate;
      let backDate = currentTimeRange[currentTimeRange.length - 1].rawDate;

      let otherDraggerVisible;
      if (draggerSelected === 'selected') {
        // check Dragger B visibility and then update Dragger A
        otherDraggerVisible = isCompareModeActive && getIsBetween(draggerTimeStateB, frontDate, backDate);
      } else {
        // check Dragger A visibility and then update Dragger B
        otherDraggerVisible = isCompareModeActive && getIsBetween(draggerTimeState, frontDate, backDate);
      }
      this.props.updateDraggerDatePosition(hoverTime, draggerSelected, null, true, otherDraggerVisible, false);
      this.setState({
        mouseDown: false
      });
    }
  }

  /**
  * @desc move dragger on axis click - calculated based on pageX vs. hover used for mouse
  * @param {Event} touch click event
  * @returns {void}
  */
  setLineTimeTouch = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.className.animVal !== 'axis-grid-rect') {
      return;
    }
    if (!this.props.isAnimationDraggerDragging && !this.props.hasMoved) {
      let {
        currentTimeRange
      } = this.state;
      let {
        isCompareModeActive,
        draggerSelected,
        draggerTimeState,
        draggerTimeStateB,
        timeScale,
        position,
        transformX,
        parentOffset
      } = this.props;
      // get x coordinate for touch event
      let touch = e.changedTouches[0];
      let pageX = touch.pageX;

      // front/back dates for calculating new date and checking if other dragger is visible
      let frontDate = currentTimeRange[0].rawDate;
      let backDate = currentTimeRange[currentTimeRange.length - 1].rawDate;

      // timescale specific options
      let options = timeScaleOptions[timeScale].timeAxis;
      let gridWidth = options.gridWidth;
      let diffZeroValues = options.scaleMs;

      // calculate position of touch click relative to front date
      let positionRelativeToFront = pageX - parentOffset - position - transformX - 2;

      // determine approximate new dragger date and coefficient based on gridwidth
      let gridWidthCoef = positionRelativeToFront / gridWidth;
      let gridWidthCoefRemainder = gridWidthCoef - Math.floor(gridWidthCoef);
      let draggerDateAdded = moment.utc(frontDate).add((Math.floor(gridWidthCoef)), timeScale);

      // get ms time value
      let draggerDateAddedValue = new Date(draggerDateAdded).getTime();
      let newDraggerTime;
      if (!diffZeroValues) { // unknown scaleMs due to varying number of days per month and year (leapyears)
        let daysCount;
        if (timeScale === 'year') {
          daysCount = draggerDateAdded.isLeapYear() ? 366 : 365;
        } else if (timeScale === 'month') {
          daysCount = draggerDateAdded.daysInMonth();
        }
        // days times milliseconds in day times remainder
        let remainderMilliseconds = daysCount * 86400000 * gridWidthCoefRemainder;
        newDraggerTime = Math.floor(draggerDateAddedValue + remainderMilliseconds);
      } else { // known scaleMs (e.g. 86400000 for day)
        newDraggerTime = draggerDateAddedValue + (diffZeroValues * gridWidthCoefRemainder);
      }

      // check other dragger visibilty on update
      let otherDraggerVisible;
      if (draggerSelected === 'selected') {
        // check Dragger B visibility and then update Dragger A
        otherDraggerVisible = isCompareModeActive && getIsBetween(draggerTimeStateB, frontDate, backDate);
      } else {
        // check Dragger A visibility and then update Dragger B
        otherDraggerVisible = isCompareModeActive && getIsBetween(draggerTimeState, frontDate, backDate);
      }
      this.props.updateDraggerDatePosition(newDraggerTime, draggerSelected, null, true, otherDraggerVisible, false);
      this.setState({
        mouseDown: false
      });
    }
  }

  /**
  * @desc handle start drag of axis sets dragging state
  * @returns {void}
  */
  handleStartDrag = (e, d) => {
    let updatePositioningArguments = {
      hasMoved: this.props.hasMoved,
      isTimelineDragging: true,
      position: this.props.position,
      transformX: this.props.transformX,
      frontDate: this.props.frontDate,
      backDate: this.props.backDate,
      draggerPosition: this.props.draggerPosition,
      draggerPositionB: this.props.draggerPositionB,
      draggerVisible: this.props.draggerVisible,
      draggerVisibleB: this.props.draggerVisibleB,
      animationStartLocation: this.props.animationStartLocation,
      animationEndLocation: this.props.animationEndLocation
    };
    this.props.updatePositioning(updatePositioningArguments);
  }

  /**
  * @desc drag axis - will update date range if dragged into past/future past dragSentinelChangeNumber
  * @param {Event} mouse event
  * @param {Object} draggable delta object
  * @returns {void}
  */
  handleDrag(e, d) {
    e.stopPropagation();
    if (e.type !== 'wheel') {
      e.preventDefault();
    }
    let {
      gridWidth,
      dragSentinelChangeNumber,
      dragSentinelCount
    } = this.state;
    let {
      timeScale,
      position,
      animationStartLocation,
      animationEndLocation,
      draggerPosition,
      draggerPositionB
    } = this.props;

    let deltaX = d.deltaX;
    position = position + deltaX;
    draggerPosition = draggerPosition + deltaX;
    draggerPositionB = draggerPositionB + deltaX;
    animationStartLocation = animationStartLocation + deltaX;
    animationEndLocation = animationEndLocation + deltaX;
    // update not necessary for year since all years are displayed
    if (timeScale === 'year') {
      let frontDate = this.state.currentTimeRange[0].rawDate;
      let backDate = this.state.currentTimeRange[this.state.currentTimeRange.length - 1].rawDate;
      let updatePositioningArguments = {
        hasMoved: true,
        isTimelineDragging: true,
        position,
        transformX: this.props.transformX,
        frontDate,
        backDate,
        draggerPosition,
        draggerPositionB,
        draggerVisible: this.props.draggerVisible,
        draggerVisibleB: this.props.draggerVisibleB,
        animationStartLocation,
        animationEndLocation
      };
      this.setState({
        dragSentinelCount: dragSentinelCount + deltaX
      });
      this.props.updatePositioning(updatePositioningArguments);
    } else {
      if (deltaX > 0) { // dragging right - exposing past dates
        if (dragSentinelCount + deltaX > dragSentinelChangeNumber) {
          // handle over drag the necessitates multiple axis updates
          let overDrag = 0;
          if (dragSentinelCount + deltaX > dragSentinelChangeNumber * 2) {
            overDrag = Math.abs(dragSentinelCount + deltaX - dragSentinelChangeNumber * 2);
          }
          let {
            currentTimeRange,
            transformX,
            draggerVisible,
            draggerVisibleB,
            overDragGrids,
            newDraggerPosition,
            newDraggerPositionB
          } = this.updateTimeRangeFromDrag(
            position,
            deltaX,
            draggerPosition,
            draggerPositionB,
            overDrag
          );

          let newDragSentinelCount = dragSentinelCount + deltaX - dragSentinelChangeNumber - overDragGrids * gridWidth;
          let frontDate = currentTimeRange[0].rawDate;
          let backDate = currentTimeRange[currentTimeRange.length - 1].rawDate;
          let updatePositioningArguments = {
            hasMoved: true,
            isTimelineDragging: true,
            position,
            transformX,
            frontDate,
            backDate,
            draggerPosition: newDraggerPosition,
            draggerPositionB: newDraggerPositionB,
            draggerVisible,
            draggerVisibleB,
            animationStartLocation,
            animationEndLocation
          };
          this.setState({
            currentTimeRange,
            dragSentinelCount: newDragSentinelCount
          });
          this.props.updatePositioning(updatePositioningArguments);
        } else {
          // reset dragSentinelCount on direction change to remaining distance to dragSentinelChangeNumber
          let newDragSentinelCount = dragSentinelCount < 0
            ? dragSentinelChangeNumber + dragSentinelCount + deltaX
            : dragSentinelCount + deltaX;
          let updatePositioningArguments = {
            hasMoved: true,
            isTimelineDragging: true,
            position,
            transformX: this.props.transformX,
            frontDate: this.props.frontDate,
            backDate: this.props.backDate,
            draggerPosition,
            draggerPositionB,
            draggerVisible: this.props.draggerVisible,
            draggerVisibleB: this.props.draggerVisibleB,
            animationStartLocation,
            animationEndLocation
          };
          this.setState({
            dragSentinelCount: newDragSentinelCount
          });
          this.props.updatePositioning(updatePositioningArguments);
        }
      } else if (deltaX < 0) { // dragging left - exposing future dates
        if (dragSentinelCount + deltaX < -dragSentinelChangeNumber) {
          // handle over drag the necessitates multiple axis updates
          let overDrag = 0;
          if (dragSentinelCount + deltaX < -dragSentinelChangeNumber * 2) {
            overDrag = Math.abs(dragSentinelCount + deltaX + dragSentinelChangeNumber * 2);
          }
          let {
            currentTimeRange,
            transformX,
            draggerVisible,
            draggerVisibleB,
            overDragGrids,
            newDraggerPosition,
            newDraggerPositionB
          } = this.updateTimeRangeFromDrag(
            position,
            deltaX,
            draggerPosition,
            draggerPositionB,
            overDrag
          );

          let newDragSentinelCount = dragSentinelCount + deltaX + dragSentinelChangeNumber + overDragGrids * gridWidth;
          let frontDate = currentTimeRange[0].rawDate;
          let backDate = currentTimeRange[currentTimeRange.length - 1].rawDate;
          let updatePositioningArguments = {
            hasMoved: true,
            isTimelineDragging: true,
            position,
            transformX,
            frontDate,
            backDate,
            draggerPosition: newDraggerPosition,
            draggerPositionB: newDraggerPositionB,
            draggerVisible,
            draggerVisibleB,
            animationStartLocation,
            animationEndLocation
          };
          this.setState({
            currentTimeRange,
            dragSentinelCount: newDragSentinelCount
          });
          this.props.updatePositioning(updatePositioningArguments);
        } else {
          // reset dragSentinelCount on direction change to remaining distance to dragSentinelChangeNumber
          let newDragSentinelCount = dragSentinelCount > 0
            ? -dragSentinelChangeNumber + dragSentinelCount + deltaX
            : dragSentinelCount + deltaX;
          let updatePositioningArguments = {
            hasMoved: true,
            isTimelineDragging: true,
            position,
            transformX: this.props.transformX,
            frontDate: this.props.frontDate,
            backDate: this.props.backDate,
            draggerPosition,
            draggerPositionB,
            draggerVisible: this.props.draggerVisible,
            draggerVisibleB: this.props.draggerVisibleB,
            animationStartLocation,
            animationEndLocation
          };
          this.setState({
            dragSentinelCount: newDragSentinelCount
          });
          this.props.updatePositioning(updatePositioningArguments);
        }
      }
    }
  }

  /**
  * @desc handle stop drag of axis.
  * d.x === midpoint means an axis click and hasMoved is false
  * @param {Event} mouse event
  * @param {Object} draggable delta object
  * @returns {void}
  */
  handleStopDrag = (e, d) => {
    let {
      midPoint,
      leftBound,
      rightBound
    } = this.state;
    let {
      timeScale,
      position,
      transformX
    } = this.props;

    position = position - midPoint;
    let hasMoved = false;
    // drag left OR drag right
    if (d.x < midPoint || d.x > midPoint) {
      hasMoved = true;
    }

    // new left/right axis bounds
    leftBound = leftBound + (midPoint - d.x);
    rightBound = rightBound + (midPoint - d.x);
    if (timeScale === 'year') {
      leftBound = -midPoint * 2;
      rightBound = midPoint * 2;
    }
    transformX = transformX + position;
    let updatePositioningArguments = {
      hasMoved,
      isTimelineDragging: false,
      position: midPoint,
      transformX,
      frontDate: this.props.frontDate,
      backDate: this.props.backDate,
      draggerPosition: this.props.draggerPosition,
      draggerPositionB: this.props.draggerPositionB,
      draggerVisible: this.props.draggerVisible,
      draggerVisibleB: this.props.draggerVisibleB,
      animationStartLocation: this.props.animationStartLocation,
      animationEndLocation: this.props.animationEndLocation
    };
    this.setState({
      leftBound,
      rightBound
    });
    // hoverTime conditional reset necessary for touchpad horizontal scroll gesture
    let hoverTime = hasMoved ? null : this.props.hoverTime;
    this.props.updatePositioning(updatePositioningArguments, hoverTime);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.init === true) {
      return true;
    } else {
      let {
        axisWidth,
        dateA,
        dateB,
        draggerSelected,
        timeScale,
        isCompareModeActive,
        hasSubdailyLayers,
        timelineEndDateLimit,
        transformX,
        frontDate,
        backDate
      } = this.props;

      let checkForPropsUpdates = (
        nextProps.axisWidth === axisWidth &&
        nextProps.dateA === dateA &&
        nextProps.dateB === dateB &&
        nextProps.draggerSelected === draggerSelected &&
        nextProps.timeScale === timeScale &&
        nextProps.isCompareModeActive === isCompareModeActive &&
        nextProps.hasSubdailyLayers === hasSubdailyLayers &&
        nextProps.timelineEndDateLimit === timelineEndDateLimit &&
        nextProps.transformX === transformX &&
        nextProps.frontDate === frontDate &&
        nextProps.backDate === backDate
      );

      let {
        dragSentinelChangeNumber,
        dragSentinelCount,
        gridNumber,
        gridWidth,
        leftBound,
        midPoint,
        numberOfVisibleTiles,
        rightBound,
        wheelZoom
      } = this.state;

      let checkForStateUpdates = (
        dragSentinelChangeNumber === nextState.dragSentinelChangeNumber &&
        dragSentinelCount === nextState.dragSentinelCount &&
        gridNumber === nextState.gridNumber &&
        gridWidth === nextState.gridWidth &&
        leftBound === nextState.leftBound &&
        midPoint === nextState.midPoint &&
        numberOfVisibleTiles === nextState.numberOfVisibleTiles &&
        rightBound === nextState.rightBound &&
        wheelZoom === nextState.wheelZoom
      );

      if (checkForPropsUpdates && checkForStateUpdates) {
        return false;
      }
    }
    return true;
  }

  render() {
    let {
      axisWidth,
      timeScale,
      position,
      transformX
    } = this.props;

    let {
      currentTimeRange,
      gridWidth,
      leftBound,
      rightBound
    } = this.state;

    return (
      <React.Fragment>
        <div className='timeline-axis-container'
          style={{ width: `${axisWidth}px` }}
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.setLineTime}
          onWheel={this.handleWheel}
          onMouseOver={this.showHoverOn}
          onMouseLeave={this.props.showHoverOff}
          onTouchStart={this.handleMouseDown}
          onTouchEnd={this.setLineTimeTouch}
        >
          {currentTimeRange
            ? <svg className='timeline-axis-svg'
              id='timeline-footer-svg'
              width={axisWidth}
              height={64}
              viewBox={`0 0 ${axisWidth} 64`}
              preserveAspectRatio='xMinYMin slice'>
              <defs>
                {/* clip axis grid text */}
                <clipPath id='textDisplay'>
                  <rect width='200' height='64' />
                </clipPath>
                {/* clip axis grid overflow */}
                <clipPath id='timelineBoundary'>
                  <rect width={axisWidth} height={64}></rect>
                </clipPath>
              </defs>
              <Draggable
                axis='x'
                handle=".axis-grid-container"
                position={{ x: position, y: 0 }}
                onDrag={this.handleDrag}
                onStart={this.handleStartDrag}
                onStop={this.handleStopDrag}
                bounds={{ left: leftBound, top: 0, bottom: 0, right: rightBound }}
              >
                <g>
                  <GridRange
                    showHover={this.props.showHover}
                    timeScale={timeScale}
                    gridWidth={gridWidth}
                    timeRange={currentTimeRange}
                    transformX={transformX}
                  />
                </g>
              </Draggable>
            </svg>
            : null }
        </div>
      </React.Fragment>
    );
  }
}

TimelineAxis.propTypes = {
  animEndLocationDate: PropTypes.object,
  animStartLocationDate: PropTypes.object,
  axisWidth: PropTypes.number,
  changeTimeScale: PropTypes.func,
  updateDraggerDatePosition: PropTypes.func,
  showHover: PropTypes.func,
  showHoverOn: PropTypes.func,
  showHoverOff: PropTypes.func,
  updatePositioning: PropTypes.func,
  isCompareModeActive: PropTypes.bool,
  draggerSelected: PropTypes.string,
  hasSubdailyLayers: PropTypes.bool,
  parentOffset: PropTypes.number,
  leftOffset: PropTypes.number,
  draggerPosition: PropTypes.number,
  draggerPositionB: PropTypes.number,
  draggerVisible: PropTypes.bool,
  draggerVisibleB: PropTypes.bool,
  animationStartLocation: PropTypes.number,
  animationEndLocation: PropTypes.number,
  position: PropTypes.number,
  transformX: PropTypes.number,
  hoverTime: PropTypes.string,
  dateA: PropTypes.string,
  dateB: PropTypes.string,
  draggerTimeState: PropTypes.string,
  draggerTimeStateB: PropTypes.string,
  frontDate: PropTypes.string,
  backDate: PropTypes.string,
  startDate: PropTypes.string,
  timeScale: PropTypes.string,
  timelineEndDateLimit: PropTypes.string,
  timelineStartDateLimit: PropTypes.string,
  isDraggerDragging: PropTypes.bool,
  isAnimationDraggerDragging: PropTypes.bool,
  isTimelineDragging: PropTypes.bool,
  hasMoved: PropTypes.bool
};

export default TimelineAxis;
