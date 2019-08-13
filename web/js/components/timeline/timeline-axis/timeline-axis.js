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
  * @desc main function to update axis scale, time range, grids tiles/text, dragger A/B positions, animation start/end draggers
  * @param {String} inputDate
  * @param {String} timeScale
  * @param {Number} axisWidthInput
  * @param {Number} leftOffsetFixedCoeff
  * @param {Boolean} hoverChange
  * @param {String} previousTimeScale - limited use for hover timeScale change
  * @returns {void}
  */
  updateScale = (inputDate, timeScale, axisWidthInput, leftOffsetFixedCoeff, hoverChange, previousTimeScale) => {
    const {
      dateA,
      dateB,
      axisWidth,
      hoverTime,
      leftOffset,
      draggerSelected,
      draggerTimeState,
      draggerTimeStateB,
      isCompareModeActive,
      animStartLocationDate,
      animEndLocationDate,
      timelineStartDateLimit,
      timelineEndDateLimit
    } = this.props;
    const options = timeScaleOptions[timeScale].timeAxis;
    const gridWidth = options.gridWidth;
    const timelineAxisWidth = axisWidthInput || axisWidth;
    const hoverLeftOffset = leftOffsetFixedCoeff
      ? timelineAxisWidth * leftOffsetFixedCoeff
      : leftOffset === 0
        ? timelineAxisWidth * 0.80
        : leftOffset;

    const numberOfVisibleTiles = Number((timelineAxisWidth / gridWidth).toFixed(8));
    let gridNumber = Math.floor(numberOfVisibleTiles * 1.5);
    const dragSentinelChangeNumber = gridWidth * (Math.floor(numberOfVisibleTiles * 0.25) + 1);
    if (timeScale === 'year') {
      const endLimitYear = new Date(timelineEndDateLimit).getUTCFullYear() + 1;
      const startLimitYear = new Date(timelineStartDateLimit).getUTCFullYear();
      gridNumber = endLimitYear - startLimitYear;
    }

    // this is the middle on the axis based on number of tiles determined from width of axis and gridwidth
    // this is used to determine position and also to "reset" position after an axis drag has stopped
    const midPoint = numberOfVisibleTiles / 2 * gridWidth - gridWidth * gridNumber / 2;

    // horizontal scroll will disable this, so use frontDate in that case
    let hoverTimeString = hoverTime || this.props.draggerTimeState;

    // handle timeline axis start/end limits
    const isBeforeStart = new Date(hoverTimeString) <= new Date(timelineStartDateLimit);
    if (isBeforeStart) {
      hoverTimeString = timelineStartDateLimit;
    } else {
      const isAfterEnd = new Date(hoverTimeString) >= new Date(timelineEndDateLimit);
      if (isAfterEnd) {
        hoverTimeString = timelineEndDateLimit;
      }
    }

    // use input date or hoverTime
    const hoverTimeDate = inputDate ? moment.utc(inputDate) : moment.utc(hoverTimeString);
    let hoverTimeZero = hoverTimeDate.clone().startOf(timeScale);
    if (timeScale === 'year') {
      hoverTimeZero = moment.utc(timelineStartDateLimit);
    }
    const hoverTimeNextZero = hoverTimeZero.clone().add(1, timeScale);

    // conditionally determine dragger times
    let draggerTime;
    let draggerTimeB;
    if (draggerSelected === 'selected') {
      draggerTime = hoverChange
        ? draggerTimeState
        : isCompareModeActive
          ? dateA
          : inputDate || draggerTimeState;
      draggerTimeB = isCompareModeActive ? dateB : draggerTimeStateB;
    } else {
      draggerTime = isCompareModeActive ? dateA : draggerTimeState;
      draggerTimeB = hoverChange
        ? draggerTimeStateB
        : isCompareModeActive
          ? dateB
          : inputDate || draggerTimeStateB;
    }

    // value of hover time, hover time time unit zeroed, hover time next unit time unit zeroed
    const hoverTimeValue = hoverTimeDate.valueOf();
    const hoverTimeZeroValue = hoverTimeZero.valueOf();
    const hoverTimeNextZeroValue = hoverTimeNextZero.valueOf();

    // individual pixelsToAdd based on time offset (e.g., get 04:38:00 based on 04:00:00)
    const diffZeroValues = hoverTimeNextZeroValue - hoverTimeZeroValue;
    const diffFactor = diffZeroValues / gridWidth;
    const diffStartAndZeroed = hoverTimeValue - hoverTimeZeroValue;
    const pixelsToAdd = diffStartAndZeroed / diffFactor;

    // offset grids needed since each zoom in won't be centered
    const offSetGrids = Math.floor(hoverLeftOffset / gridWidth);
    const offSetHalved = Math.floor(gridNumber / 2);
    const offSetGridsDiff = offSetGrids - Math.floor(numberOfVisibleTiles / 2);
    let gridsToSubtract = offSetHalved + offSetGridsDiff;
    let gridsToAdd = offSetHalved - offSetGridsDiff;

    // determine if changing timeScale from greater to lesser (e.g., 'year' to 'month')
    const greaterToLesserTimescale = timeScale && previousTimeScale
      ? timeScaleToNumberKey[timeScale] < timeScaleToNumberKey[previousTimeScale]
      : null;
    if (greaterToLesserTimescale) {
      // determine how far hoverTime date is from end to compensate for bounds correction
      const hoverTimeToEndDateLimit = moment.utc(timelineEndDateLimit).diff(hoverTimeDate, timeScale);
      if (hoverTimeToEndDateLimit < offSetHalved) {
        gridsToSubtract = gridsToSubtract + (offSetHalved - hoverTimeToEndDateLimit) - offSetGrids;
        gridsToAdd = gridsToAdd - (offSetHalved - hoverTimeToEndDateLimit) + offSetGrids;
      }
    }

    // build time range array
    const timeRange = this.getTimeRangeArray(gridsToSubtract, gridsToAdd, hoverTimeDate);
    // get front and back dates
    const frontDate = moment.utc(timeRange[0].rawDate);
    const backDate = timeRange[timeRange.length - 1].rawDate;

    // check if dragger date is between front/back dates
    let draggerPosition = 0;
    let draggerVisible = false;
    const isBetween = getIsBetween(draggerTime, frontDate, backDate);
    if (isBetween) {
      draggerPosition = Math.abs(frontDate.diff(draggerTime, timeScale, true) * gridWidth);
      if (isCompareModeActive || draggerSelected === 'selected') {
        draggerVisible = true;
      }
    }
    let draggerPositionB = 0;
    let draggerVisibleB = false;
    const isBetweenB = getIsBetween(draggerTimeB, frontDate, backDate);
    if (isBetweenB) {
      draggerPositionB = Math.abs(frontDate.diff(draggerTimeB, timeScale, true) * gridWidth);
      if (isCompareModeActive || draggerSelected === 'selectedB') {
        draggerVisibleB = true;
      }
    }

    // update animation draggers
    let animationStartDraggerLocation = 0;
    let animationEndDraggerLocation = 0;
    if (animStartLocationDate) {
      animationStartDraggerLocation = moment.utc(animStartLocationDate).diff(frontDate, timeScale, true) * gridWidth;
      animationEndDraggerLocation = moment.utc(animEndLocationDate).diff(frontDate, timeScale, true) * gridWidth;
    }

    // get axis position
    let position;
    // axisWidthInput conditional in place to handle resize centering of position
    if (axisWidthInput) {
      position = midPoint;
    } else {
      if (timeScale === 'year') {
        position = timelineAxisWidth / 2 + (hoverLeftOffset - timelineAxisWidth / 2);
      } else {
        // - (offSetGridsDiff * gridWidth) to compensate off center zooming repositioning
        position = midPoint - (timelineAxisWidth / 2 - hoverLeftOffset).toFixed(10) - offSetGridsDiff * gridWidth;
        if (gridNumber % 2 !== 0) { // handle odd number gridNumber grid offset
          position += gridWidth / 2;
        }
      }
    }

    // get axis bounds
    const diffFromStartDateLimit = hoverTimeDate.diff(timelineStartDateLimit, timeScale);
    const diffFromEndDateLimit = frontDate.diff(timelineEndDateLimit, timeScale);
    let leftBound = diffFromEndDateLimit * gridWidth + midPoint + timelineAxisWidth;
    let rightBound = diffFromStartDateLimit * gridWidth + midPoint * 1.5 + timelineAxisWidth * 0.25;
    if (timeScale === 'year') {
      leftBound = diffFromEndDateLimit * gridWidth + pixelsToAdd + 2 + timelineAxisWidth * 0.80;
      rightBound = timelineAxisWidth * 0.25 + pixelsToAdd + 2;
    }

    // handle position being set beyond bounds due to edge dates not precisely scaling to other timescales
    let boundsDiff = 0;
    if (rightBound < position) {
      const rightBoundDiff = position - rightBound;
      rightBound = rightBound + rightBoundDiff;
      boundsDiff = boundsDiff - rightBoundDiff;
    } else {
      if (leftBound > position) {
        const leftBoundDiff = leftBound - position;
        leftBound = leftBound - leftBoundDiff;
        boundsDiff = boundsDiff + leftBoundDiff;
      }
    }

    // update transform and dragger positioning based on calulated offsets
    const transformX = boundsDiff - pixelsToAdd - 2;
    const animationStartLocation = animationStartDraggerLocation + position + transformX;
    const animationEndLocation = animationEndDraggerLocation + position + transformX;
    draggerPosition = draggerPosition - pixelsToAdd + position - this.state.draggerWidth + boundsDiff;
    draggerPositionB = draggerPositionB - pixelsToAdd + position - this.state.draggerWidth + boundsDiff;

    const updatePositioningArguments = {
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
      dragSentinelCount: boundsDiff,
      leftBound,
      rightBound,
      wheelZoom: false
    }, this.props.updatePositioning(updatePositioningArguments, timeScale === 'year' ? hoverTime : hoverTimeString));
  }

  /**
  * @desc update dates in range based on dragging axis
  * @param {Number} subtract - integer (negative numbers selects start date in the future)
  * @param {Number} add - integer (negative numbers selects end date in the past)
  * @param {string} inputDate
  * @returns {Array} timeRangeArray - time range
  */
  getTimeRangeArray = (subtract, add, inputDate) => {
    const {
      timelineEndDateLimit,
      timelineStartDateLimit,
      timeScale
    } = this.props;
    let dayZeroed;
    let startDate;
    let endDate;

    if (timeScale === 'year') {
      dayZeroed = moment.utc(inputDate).startOf('year');
      const endLimitYear = new Date(timelineEndDateLimit).getUTCFullYear() + 1;
      const startLimitYear = new Date(timelineStartDateLimit).getUTCFullYear();
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
    const timeRangeArray = getTimeRange(
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
    const overDragGrids = Math.ceil(overDrag / gridWidth);
    let timeRangeAdd;
    let transform;
    if (deltaX > 0) { // dragging right - exposing past dates
      const firstDateInRange = currentTimeRange[0].rawDate;
      timeRangeAdd = this.getTimeRangeArray(numberOfVisibleTiles + 1 + overDragGrids, -1, firstDateInRange);
      removeBackMultipleInPlace(currentTimeRange, numberOfVisibleTiles + 1 + overDragGrids);
      currentTimeRange.unshift(...timeRangeAdd);
      transform = transformX - (numberOfVisibleTiles + 1 + overDragGrids) * gridWidth;
    } else { // dragging left - exposing future dates
      const lastDateInRange = currentTimeRange[currentTimeRange.length - 1].rawDate;
      timeRangeAdd = this.getTimeRangeArray(-1, numberOfVisibleTiles + 1 + overDragGrids, lastDateInRange);
      removeFrontMultipleInPlace(currentTimeRange, numberOfVisibleTiles + 1 + overDragGrids);
      currentTimeRange.push(...timeRangeAdd);
      transform = transformX + (numberOfVisibleTiles + 1 + overDragGrids) * gridWidth;
    }

    // check if dragger is in between range and visible
    const frontDate = currentTimeRange[0].rawDate;
    const backDate = currentTimeRange[currentTimeRange.length - 1].rawDate;

    // default to input dragger positions in the event of no updates
    let newDraggerPosition = draggerPosition;
    let newDraggerPositionB = draggerPositionB;

    const sharedDraggerVisibilityParams = {
      frontDate,
      backDate,
      position,
      transform
    };

    // check selected dragger (or both if compare mode) for visibility and new position
    if (draggerSelected === 'selected' || isCompareModeActive) { // dragger A selected
      const draggerACheck = this.checkDraggerVisibility(
        draggerTimeState,
        draggerVisible,
        newDraggerPosition,
        sharedDraggerVisibilityParams
      );
      draggerVisible = draggerACheck.isVisible;
      newDraggerPosition = draggerACheck.newDraggerPosition;
    }

    if (draggerSelected === 'selectedB' || isCompareModeActive) { // dragger B selected
      const draggerBCheck = this.checkDraggerVisibility(
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
    const { gridWidth } = this.state;
    const { timeScale } = this.props;
    const isBetween = getIsBetween(draggerTime, frontDate, backDate);
    if (isBetween) {
      if (draggerVisible === false) {
        const frontDateObj = moment.utc(frontDate);
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
    const {
      draggerSelected,
      draggerTimeState,
      draggerTimeStateB,
      timeScale,
      axisWidth
    } = this.props;
    const time = draggerSelected === 'selected' ? draggerTimeState : draggerTimeStateB;
    this.updateScale(time, timeScale, axisWidth, 0.50);
  }

  componentDidUpdate(prevProps) {
    const {
      dateA,
      dateB,
      hoverTime,
      draggerSelected,
      isDraggerDragging,
      timeScale,
      axisWidth,
      isAnimationPlaying,
      isCompareModeActive,
      draggerTimeState,
      draggerTimeStateB
    } = this.props;

    // update timescale axis focus
    if (timeScale !== prevProps.timeScale) {
      let draggerDate;
      let leftOffset;
      if (this.state.wheelZoom === true) {
        draggerDate = hoverTime;
      } else {
        leftOffset = 0.80;
        if (draggerSelected === 'selected') {
          draggerDate = draggerTimeState;
        } else {
          draggerDate = draggerTimeStateB;
        }
      }
      this.updateScale(draggerDate, timeScale, null, leftOffset, true, prevProps.timeScale);
    }

    // update axis on browser width change
    if (axisWidth !== prevProps.axisWidth) {
      let draggerDate;
      if (draggerSelected === 'selected') {
        draggerDate = draggerTimeState;
      } else {
        draggerDate = draggerTimeStateB;
      }
      this.updateScale(draggerDate, timeScale, axisWidth, 0.80);
    }

    // handle switching A/B dragger axis focus if switched from A/B sidebar tabs
    if (isCompareModeActive && (draggerSelected !== prevProps.draggerSelected)) {
      if (draggerSelected === 'selected') {
        const draggerCheck = this.checkDraggerMoveOrUpdateScale(prevProps.dateA);
        if (!draggerCheck.withinRange) {
          this.updateScaleWithOffset(dateA, timeScale, draggerCheck);
        }
      } else {
        const draggerCheck = this.checkDraggerMoveOrUpdateScale(prevProps.dateB, true);
        if (!draggerCheck.withinRange) {
          this.updateScaleWithOffset(dateB, timeScale, draggerCheck);
        }
      }
    }

    const animationTurnOn = !prevProps.isAnimationPlaying && isAnimationPlaying;
    const animationTurnOff = prevProps.isAnimationPlaying && !isAnimationPlaying;
    // handle date axis focus when animation runs and animation range is not visible
    if (animationTurnOn || animationTurnOff) {
      const selectedDate = draggerSelected === 'selected' ? dateA : dateB;
      const draggerCheck = this.checkDraggerMoveOrUpdateScale(selectedDate);
      if (!draggerCheck.withinRange) {
        this.updateScale(selectedDate, timeScale, null, 0.5);
      }
    } else {
      // handle dragger and potential axis updates
      if (!isDraggerDragging) {
        // handle A dragger change
        if (draggerSelected === 'selected' || isCompareModeActive) {
          this.handleDraggerUpdateCheck(dateA, prevProps.dateA, draggerTimeState, false);
        }
        // handle B dragger change
        if (draggerSelected === 'selectedB' || isCompareModeActive) {
          this.handleDraggerUpdateCheck(dateB, prevProps.dateB, draggerTimeStateB, true);
        }
      }
    }
  }

  /**
   * @desc check if dragger within axis range or need scale update
   * @param {String} date
   * @param {String} previousDate
   * @returns {String} draggerTime
   * @returns {Boolean} isDraggerB
   */
  handleDraggerUpdateCheck = (date, previousDate, draggerTime, isDraggerB) => {
    const {
      timeScale,
      isTourActive,
      isAnimationPlaying
    } = this.props;
    if (draggerTime !== date || previousDate !== date) {
      if (previousDate === draggerTime) {
        // handle tour url date change
        if (isTourActive && !isAnimationPlaying) {
          this.updateScale(date, timeScale, null, 0.5);
        } else {
          // handle animation dragger update
          const draggerCheck = this.checkDraggerMoveOrUpdateScale(previousDate, isDraggerB);
          if (!draggerCheck.withinRange) {
            this.updateScaleWithOffset(date, timeScale, draggerCheck);
          }
        }
      } else {
        // check if draggerCheck will be within acceptable visible axis width
        const draggerCheck = this.checkDraggerMoveOrUpdateScale(previousDate, isDraggerB);
        if (!draggerCheck.withinRange) {
          this.updateScaleWithOffset(date, timeScale, draggerCheck);
        }
      }
    }
  }

  /**
   * @desc check if selectedDate will be within acceptable visible axis width
   * @param {String} previousDate
   * @param {Boolean} draggerB - draggerB being checked?
   * @returns {Object} output - return params used for dragger visibilty/updating axis
   * @returns {Boolean} output.withinRange - within visible range
   * @returns {Boolean} output.newDateInThePast - new date older?
   * @returns {Number} output.newDraggerDiff - difference of new dragger from selected
   */
  checkDraggerMoveOrUpdateScale = (previousDate, draggerB) => {
    const {
      dateA,
      dateB,
      draggerPosition,
      draggerPositionB,
      timeScale,
      axisWidth,
      frontDate,
      backDate
    } = this.props;
    let selectedDraggerTimeState;
    let selectedDraggerPosition;

    if (draggerB) {
      selectedDraggerTimeState = dateB;
      selectedDraggerPosition = draggerPositionB;
    } else {
      selectedDraggerTimeState = dateA;
      selectedDraggerPosition = draggerPosition;
    }

    const selectedDateMoment = moment.utc(previousDate);
    const draggerDateMoment = moment.utc(selectedDraggerTimeState);
    const draggerDateFormat = draggerDateMoment.format();

    const newDraggerDiff = draggerDateMoment.diff(selectedDateMoment, timeScale, true);
    const newDateInThePast = draggerDateMoment < selectedDateMoment;

    const isBeforeFrontDate = new Date(draggerDateFormat) < new Date(frontDate);
    const isAfterBackDate = new Date(draggerDateFormat) > new Date(backDate);

    const leftEdgeOfVisibleAxis = -26;
    const rightEdgeOfVisibleAxis = axisWidth - 80;
    const newDraggerWithinRangeCheck = selectedDraggerPosition <= rightEdgeOfVisibleAxis &&
                                     selectedDraggerPosition >= leftEdgeOfVisibleAxis &&
                                     !isBeforeFrontDate && !isAfterBackDate;
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
    const leftOffsetFixedCoeff = draggerCheck.newDraggerDiff > 5
      ? 0.5
      : draggerCheck.newDateInThePast
        ? !draggerCheck.withinRange
          ? 0.5
          : 0.25
        : 0.75;
    this.updateScale(date, timeScale, null, leftOffsetFixedCoeff);
  }

  // #### Drag/mouse handlers ####
  /**
  * @desc show hover line - additional parent conditons required
  * @param {Event} mouse event
  * @returns {void}
  */
  showHoverOn = (e) => {
    const { isAnimationDraggerDragging, isTimelineDragging, showHoverOn } = this.props;
    if (!isAnimationDraggerDragging && !isTimelineDragging) {
      if (e.target.className.animVal === 'axis-grid-rect') {
        showHoverOn();
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
    const {
      position,
      timeScale,
      updateTimelineMoveAndDrag,
      hasSubdailyLayers,
      changeTimeScale
    } = this.props;
    const { leftBound, rightBound } = this.state;
    const timeScaleNumber = Number(timeScaleToNumberKey[timeScale]);
    const maxTimeScaleNumber = hasSubdailyLayers ? 5 : 3;

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
        const scrollX = position - 100;
        if (scrollX < leftBound) { // cancel drag if exceeds axis leftBound
          clearTimeout(this.wheelTimeout);
          updateTimelineMoveAndDrag(false, false);
        } else {
          const deltaObj = {
            deltaX: -100,
            x: scrollX
          };
          this.handleDrag(e, deltaObj);
          clearTimeout(this.wheelTimeout);
          this.wheelTimeout = setTimeout(() => {
            this.handleStopDrag(null, deltaObj, true);
          }, 50);
        }
      } else { // multi-touch drag right
        const scrollX = position + 100;
        if (scrollX > rightBound) { // cancel drag if exceeds axis rightBound
          clearTimeout(this.wheelTimeout);
          updateTimelineMoveAndDrag(false, false);
        } else {
          const deltaObj = {
            deltaX: 100,
            x: scrollX
          };
          this.handleDrag(e, deltaObj);
          clearTimeout(this.wheelTimeout);
          this.wheelTimeout = setTimeout(() => {
            this.handleStopDrag(null, deltaObj, true);
          }, 50);
        }
      }
    }
  }

  /**
  * @desc set mouseDown to handle over dragging range-select and triggering false axis click
  * @desc clientXOnDrag used to determine if 'click then drag' vs 'click only'
  * @returns {void}
  */
  handleMouseDown = (e) => {
    let clientX;
    if (e.type === 'touchstart') {
      const touch = e.changedTouches[0];
      clientX = touch.pageX;
    } else {
      clientX = e.clientX;
    }
    this.setState({
      mouseDown: true,
      clientXOnDrag: clientX
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
    const clientX = e.clientX;
    if (clientX === this.state.clientXOnDrag) {
      const {
        currentTimeRange
      } = this.state;
      const {
        isCompareModeActive,
        draggerSelected,
        draggerTimeState,
        draggerTimeStateB,
        hoverTime
      } = this.props;
      // get front and back dates
      const frontDate = currentTimeRange[0].rawDate;
      const backDate = currentTimeRange[currentTimeRange.length - 1].rawDate;

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
    const touch = e.changedTouches[0];
    const clientX = touch.pageX;
    if (clientX === this.state.clientXOnDrag) {
      const {
        currentTimeRange
      } = this.state;
      const {
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
      const touch = e.changedTouches[0];
      const pageX = touch.pageX;

      // front/back dates for calculating new date and checking if other dragger is visible
      const frontDate = currentTimeRange[0].rawDate;
      const backDate = currentTimeRange[currentTimeRange.length - 1].rawDate;

      // timescale specific options
      const options = timeScaleOptions[timeScale].timeAxis;
      const gridWidth = options.gridWidth;
      const diffZeroValues = options.scaleMs;

      // calculate position of touch click relative to front date
      const positionRelativeToFront = pageX - parentOffset - position - transformX - 2;

      // determine approximate new dragger date and coefficient based on gridwidth
      const gridWidthCoef = positionRelativeToFront / gridWidth;
      const gridWidthCoefRemainder = gridWidthCoef - Math.floor(gridWidthCoef);
      const draggerDateAdded = moment.utc(frontDate).add((Math.floor(gridWidthCoef)), timeScale);

      // get ms time value
      const draggerDateAddedValue = new Date(draggerDateAdded).getTime();
      let newDraggerTime;
      if (!diffZeroValues) { // unknown scaleMs due to varying number of days per month and year (leapyears)
        let daysCount;
        if (timeScale === 'year') {
          daysCount = draggerDateAdded.isLeapYear() ? 366 : 365;
        } else if (timeScale === 'month') {
          daysCount = draggerDateAdded.daysInMonth();
        }
        // days times milliseconds in day times remainder
        const remainderMilliseconds = daysCount * 86400000 * gridWidthCoefRemainder;
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
  handleStartDrag = () => {
    const {
      hasMoved,
      isTimelineDragging,
      updateTimelineMoveAndDrag
    } = this.props;
    if (!isTimelineDragging) {
      updateTimelineMoveAndDrag(hasMoved, true);
    }
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
    const {
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

    const deltaX = d.deltaX;
    position = position + deltaX;
    draggerPosition = draggerPosition + deltaX;
    draggerPositionB = draggerPositionB + deltaX;
    animationStartLocation = animationStartLocation + deltaX;
    animationEndLocation = animationEndLocation + deltaX;
    // update not necessary for year since all years are displayed
    if (timeScale === 'year') {
      const frontDate = this.state.currentTimeRange[0].rawDate;
      const backDate = this.state.currentTimeRange[this.state.currentTimeRange.length - 1].rawDate;
      const updatePositioningArguments = {
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
    } else { // handle all timescale other than year
      if (deltaX > 0) { // dragging right - exposing past dates
        if (dragSentinelCount + deltaX > dragSentinelChangeNumber) {
          // handle over drag the necessitates multiple axis updates
          let overDrag = 0;
          if (dragSentinelCount + deltaX > dragSentinelChangeNumber * 2) {
            overDrag = Math.abs(dragSentinelCount + deltaX - dragSentinelChangeNumber * 2);
          }
          const {
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

          const newDragSentinelCount = dragSentinelCount + deltaX - dragSentinelChangeNumber - overDragGrids * gridWidth;
          const frontDate = currentTimeRange[0].rawDate;
          const backDate = currentTimeRange[currentTimeRange.length - 1].rawDate;
          const updatePositioningArguments = {
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
          const newDragSentinelCount = dragSentinelCount < 0
            ? dragSentinelChangeNumber + dragSentinelCount + deltaX
            : dragSentinelCount + deltaX;

          const updatePositioningArguments = {
            hasMoved: true,
            isTimelineDragging: true,
            position,
            draggerPosition,
            draggerPositionB,
            animationStartLocation,
            animationEndLocation
          };
          this.setState({
            dragSentinelCount: newDragSentinelCount
          });
          this.props.updatePositioningOnSimpleDrag(updatePositioningArguments);
        }
      } else if (deltaX < 0) { // dragging left - exposing future dates
        if (dragSentinelCount + deltaX < -dragSentinelChangeNumber) {
          // handle over drag the necessitates multiple axis updates
          let overDrag = 0;
          if (dragSentinelCount + deltaX < -dragSentinelChangeNumber * 2) {
            overDrag = Math.abs(dragSentinelCount + deltaX + dragSentinelChangeNumber * 2);
          }
          const {
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

          const newDragSentinelCount = dragSentinelCount + deltaX + dragSentinelChangeNumber + overDragGrids * gridWidth;
          const frontDate = currentTimeRange[0].rawDate;
          const backDate = currentTimeRange[currentTimeRange.length - 1].rawDate;
          const updatePositioningArguments = {
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
          const newDragSentinelCount = dragSentinelCount > 0
            ? -dragSentinelChangeNumber + dragSentinelCount + deltaX
            : dragSentinelCount + deltaX;

          const updatePositioningArguments = {
            hasMoved: true,
            isTimelineDragging: true,
            position,
            draggerPosition,
            draggerPositionB,
            animationStartLocation,
            animationEndLocation
          };
          this.setState({
            dragSentinelCount: newDragSentinelCount
          });
          this.props.updatePositioningOnSimpleDrag(updatePositioningArguments);
        }
      }
    }
  }

  /**
  * @desc handle stop drag of axis.
  * d.x === midpoint means an axis click and hasMoved is false
  * @param {Event} mouse event
  * @param {Object} draggable delta object
  * @param {Boolean} wheelZoom only true when using wheel gestures
  * @returns {void}
  */
  handleStopDrag(e, d, wheelZoom) {
    let {
      midPoint,
      leftBound,
      rightBound
    } = this.state;
    let {
      position,
      hoverTime,
      transformX,
      updatePositioningOnAxisStopDrag
    } = this.props;

    position = position - midPoint;
    let hasMoved = false;
    // drag left OR drag right
    if (d.x !== midPoint) {
      hasMoved = true;
    }
    if (!wheelZoom) {
      hasMoved = false;
    }
    // new left/right axis bounds
    leftBound = leftBound + (midPoint - d.x);
    rightBound = rightBound + (midPoint - d.x);
    transformX = transformX + position;

    const updatePositioningArguments = {
      hasMoved,
      isTimelineDragging: false,
      position: midPoint,
      transformX
    };
    this.setState({
      leftBound,
      rightBound,
      wheelZoom: !!wheelZoom
    });
    // hoverTime conditional reset necessary for touchpad horizontal scroll gesture
    const hoverTimeDate = hasMoved ? null : hoverTime;
    updatePositioningOnAxisStopDrag(updatePositioningArguments, hoverTimeDate);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.init === true) {
      return true;
    } else {
      const {
        axisWidth,
        draggerSelected,
        timeScale,
        isCompareModeActive,
        hasSubdailyLayers,
        timelineEndDateLimit,
        transformX,
        frontDate,
        backDate,
        position,
        dateA,
        dateB
      } = this.props;

      const checkForPropsUpdates = (
        nextProps.axisWidth === axisWidth &&
        nextProps.position === position &&
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

      const {
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

      const checkForStateUpdates = (
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
    const {
      axisWidth,
      timeScale,
      position,
      transformX,
      showHover,
      showHoverOff
    } = this.props;
    const {
      currentTimeRange,
      gridWidth,
      leftBound,
      rightBound
    } = this.state;
    return (
      <React.Fragment>
        <div className="timeline-axis-container"
          style={{ width: `${axisWidth}px` }}
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.setLineTime}
          onWheel={this.handleWheel}
          onMouseOver={this.showHoverOn}
          onMouseLeave={showHoverOff}
          onTouchStart={this.handleMouseDown}
          onTouchEnd={this.setLineTimeTouch}
        >
          {currentTimeRange
            ? <svg className="timeline-axis-svg"
              id="timeline-footer-svg"
              width={axisWidth}
              height={64}
              viewBox={`0 0 ${axisWidth} 64`}
              preserveAspectRatio="xMinYMin slice">
              <defs>
                {/* clip axis grid text */}
                <clipPath id="textDisplay">
                  <rect width="200" height="64" />
                </clipPath>
                {/* clip axis grid overflow */}
                <clipPath id="timelineBoundary">
                  <rect width={axisWidth} height={64}></rect>
                </clipPath>
              </defs>
              <Draggable
                axis="x"
                handle=".axis-grid-container"
                position={{ x: position, y: 0 }}
                onDrag={this.handleDrag}
                onStart={this.handleStartDrag}
                onStop={this.handleStopDrag}
                bounds={{ left: leftBound, top: 0, bottom: 0, right: rightBound }}
              >
                <g>
                  <GridRange
                    showHover={showHover}
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
  animationEndLocation: PropTypes.number,
  animationStartLocation: PropTypes.number,
  animEndLocationDate: PropTypes.object,
  animStartLocationDate: PropTypes.object,
  axisWidth: PropTypes.number,
  backDate: PropTypes.string,
  changeTimeScale: PropTypes.func,
  dateA: PropTypes.string,
  dateB: PropTypes.string,
  draggerPosition: PropTypes.number,
  draggerPositionB: PropTypes.number,
  draggerSelected: PropTypes.string,
  draggerTimeState: PropTypes.string,
  draggerTimeStateB: PropTypes.string,
  draggerVisible: PropTypes.bool,
  draggerVisibleB: PropTypes.bool,
  frontDate: PropTypes.string,
  hasMoved: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  hoverTime: PropTypes.string,
  isAnimationDraggerDragging: PropTypes.bool,
  isAnimationPlaying: PropTypes.bool,
  isCompareModeActive: PropTypes.bool,
  isDraggerDragging: PropTypes.bool,
  isTimelineDragging: PropTypes.bool,
  isTourActive: PropTypes.bool,
  leftOffset: PropTypes.number,
  parentOffset: PropTypes.number,
  position: PropTypes.number,
  showHover: PropTypes.func,
  showHoverOff: PropTypes.func,
  showHoverOn: PropTypes.func,
  startDate: PropTypes.string,
  timelineEndDateLimit: PropTypes.string,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  transformX: PropTypes.number,
  updateDraggerDatePosition: PropTypes.func,
  updatePositioning: PropTypes.func,
  updatePositioningOnAxisStopDrag: PropTypes.func,
  updatePositioningOnSimpleDrag: PropTypes.func,
  updateTimelineMoveAndDrag: PropTypes.func
};

export default TimelineAxis;
