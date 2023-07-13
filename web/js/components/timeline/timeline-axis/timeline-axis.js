import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import moment from 'moment';
import {
  isEqual as lodashIsEqual,
  isEmpty as lodashIsEmpty,
} from 'lodash';
import GridRange from './grid-range/grid-range';

import getTimeRange from './date-calc';
import {
  timeScaleOptions,
  TIME_SCALE_TO_NUMBER,
} from '../../../modules/date/constants';
import {
  getIsBetween,
  getISODateFormatted,
  removeBackMultipleInPlace,
  removeFrontMultipleInPlace,
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
      hitRightBound: false,
      hitLeftBound: false,
      updatedTimeScale: false,
      clientXOnDrag: 0,
    };
    // axis
    this.handleDrag = this.handleDrag.bind(this);
    this.handleStartDrag = this.handleStartDrag.bind(this);
    this.handleStopDrag = this.handleStopDrag.bind(this);

    // axis click to set dragger
    this.setLineTime = this.setLineTime.bind(this);

    // wheel event timeout
    this.wheelTimeout = 0;
  }

  componentDidMount() {
    const {
      draggerSelected,
      draggerTimeState,
      draggerTimeStateB,
      timeScale,
    } = this.props;
    const time = draggerSelected === 'selected' ? draggerTimeState : draggerTimeStateB;
    this.updateScale(time, timeScale, 0.5);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { init } = this.state;
    if (init === true) {
      return true;
    }
    const {
      axisWidth,
      draggerSelected,
      timeScale,
      isCompareModeActive,
      isAnimatingToEvent,
      hasFutureLayers,
      hasSubdailyLayers,
      matchingTimelineCoverage,
      timelineEndDateLimit,
      transformX,
      frontDate,
      backDate,
      position,
      dateA,
      dateB,
    } = this.props;

    const checkForPropsUpdates = nextProps.axisWidth === axisWidth
      && nextProps.position === position
      && nextProps.isAnimatingToEvent === isAnimatingToEvent
      && nextProps.dateA === dateA
      && nextProps.dateB === dateB
      && nextProps.draggerSelected === draggerSelected
      && nextProps.timeScale === timeScale
      && nextProps.isCompareModeActive === isCompareModeActive
      && nextProps.hasFutureLayers === hasFutureLayers
      && nextProps.hasSubdailyLayers === hasSubdailyLayers
      && nextProps.timelineEndDateLimit === timelineEndDateLimit
      && nextProps.transformX === transformX
      && nextProps.frontDate === frontDate
      && nextProps.backDate === backDate
      && lodashIsEqual(nextProps.matchingTimelineCoverage, matchingTimelineCoverage);

    const {
      dragSentinelChangeNumber,
      dragSentinelCount,
      gridNumber,
      gridWidth,
      leftBound,
      midPoint,
      numberOfVisibleTiles,
      rightBound,
      wheelZoom,
    } = this.state;

    const checkForStateUpdates = dragSentinelChangeNumber === nextState.dragSentinelChangeNumber
        && dragSentinelCount === nextState.dragSentinelCount
        && gridNumber === nextState.gridNumber
        && gridWidth === nextState.gridWidth
        && leftBound === nextState.leftBound
        && midPoint === nextState.midPoint
        && numberOfVisibleTiles === nextState.numberOfVisibleTiles
        && rightBound === nextState.rightBound
        && wheelZoom === nextState.wheelZoom;
    if (checkForPropsUpdates && checkForStateUpdates) {
      return false;
    }
    return true;
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
      hasFutureLayers,
      onDateChange,
      isAnimationPlaying,
      isAnimatingToEvent,
      isCompareModeActive,
      isTimelineDragging,
      draggerTimeState,
      draggerTimeStateB,
      timelineEndDateLimit,
    } = this.props;
    const { wheelZoom } = this.state;
    let draggerDate = draggerSelected === 'selected' ? draggerTimeState : draggerTimeStateB;

    // update timescale axis focus
    if (timeScale !== prevProps.timeScale) {
      let leftOffset;
      if (wheelZoom === true) {
        draggerDate = hoverTime;
      } else {
        leftOffset = 0.8;
      }
      // add updateTimeScale flag to indicate showHover should not fire immediately
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        updatedTimeScale: true,
      });
      this.updateScale(draggerDate, timeScale, leftOffset, true, prevProps.timeScale);
    }

    // update axis on finish animate to event
    if (prevProps.isAnimatingToEvent && !isAnimatingToEvent) {
      this.updateScale(draggerDate, timeScale, 0.5);
    }

    // update axis on browser width change
    if (axisWidth !== prevProps.axisWidth) {
      this.updateScale(draggerDate, timeScale, 0.5);
    }

    // update scale if end time limit has changed (e.g. time has elapsed since the app was started)
    const hasFutureLayersUpdated = prevProps.hasFutureLayers !== hasFutureLayers;
    const isTimelineInteracting = isDraggerDragging || isTimelineDragging;
    const didTimelineEndDateLimitUpdate = timelineEndDateLimit !== prevProps.timelineEndDateLimit;
    if (didTimelineEndDateLimitUpdate && (!isAnimationPlaying || hasFutureLayersUpdated) && !isTimelineInteracting) {
      const updatedDraggerDate = hasFutureLayersUpdated
        ? new Date(draggerDate) > new Date(timelineEndDateLimit)
          ? timelineEndDateLimit
          : draggerDate
        : draggerDate;
      onDateChange(new Date(updatedDraggerDate));
      this.updateScale(updatedDraggerDate, timeScale, 0.5);
    }

    // handle switching A/B dragger axis focus if switched from A/B sidebar tabs
    if (isCompareModeActive && (draggerSelected !== prevProps.draggerSelected)) {
      if (draggerSelected === 'selected') {
        const draggerCheck = this.checkDraggerMoveOrUpdateScale(prevProps.dateA);
        if (!draggerCheck.withinRange) {
          this.updateScaleWithOffset(dateA, timeScale, draggerCheck.newDateInThePast);
        }
      } else {
        const draggerCheck = this.checkDraggerMoveOrUpdateScale(prevProps.dateB, true);
        if (!draggerCheck.withinRange) {
          this.updateScaleWithOffset(dateB, timeScale, draggerCheck.newDateInThePast);
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
        this.updateScale(selectedDate, timeScale, 0.5);
      }
    // handle dragger and potential axis updates
    } else if (!isDraggerDragging) {
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

  /**
  * @desc main function to update axis scale, time range, grids tiles/text, dragger A/B positions, animation start/end draggers
  * @param {String} inputDate
  * @param {String} updatedTimeScale
  * @param {Number} leftOffsetFixedCoefficient
  * @param {Boolean} hoverChange
  * @param {String} previousTimeScale - limited use for hover timeScale change
  * @returns {void}
  */
  updateScale = (inputDate, timeScale, leftOffsetFixedCoefficient, hoverChange, previousTimeScale) => {
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
      timelineEndDateLimit,
      updatePositioning,
    } = this.props;
    const { draggerWidth } = this.state;
    const options = timeScaleOptions[timeScale].timeAxis;
    const { gridWidth } = options;
    const timelineAxisWidth = axisWidth;
    const hoverLeftOffset = leftOffsetFixedCoefficient
      ? timelineAxisWidth * leftOffsetFixedCoefficient
      : leftOffset === 0
        ? timelineAxisWidth * 0.8
        : leftOffset;

    // visible tiles based on timeline axis width (screen/browser size dependent)
    const numberOfVisibleTiles = Number((timelineAxisWidth / gridWidth).toFixed(8));
    // grid overflow/cushion coefficient
    const gridOverflowCoefficient = 2.5;
    let gridNumber = Math.floor(numberOfVisibleTiles * gridOverflowCoefficient);
    const dragSentinelChangeNumber = gridWidth * (Math.floor(numberOfVisibleTiles * 0.25) + 1);
    if (timeScale === 'year') {
      const endLimitYear = new Date(timelineEndDateLimit).getUTCFullYear() + 1;
      const startLimitYear = new Date(timelineStartDateLimit).getUTCFullYear();
      gridNumber = endLimitYear - startLimitYear;
    } else if (timeScale === 'month') {
      const endLimitMonthAdded = moment.utc(timelineEndDateLimit).startOf('month').add(1, 'month');
      const monthTotal = moment.utc(endLimitMonthAdded).diff(timelineStartDateLimit, 'months');
      gridNumber = monthTotal;
    }

    // this is the middle on the axis based on number of tiles determined from width of axis and grid width
    // this is used to determine position and also to "reset" position after an axis drag has stopped
    // eslint-disable-next-line no-mixed-operators
    const midPoint = numberOfVisibleTiles / 2 * gridWidth - gridWidth * gridNumber / 2;

    // horizontal scroll will disable this, so use frontDate in that case
    let hoverTimeString = hoverTime || draggerTimeState;

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
    let hoverTimeZero;
    const isYearOrMonth = timeScale === 'year' || timeScale === 'month';
    if (isYearOrMonth) {
      hoverTimeZero = moment.utc(timelineStartDateLimit);
    } else {
      hoverTimeZero = hoverTimeDate.clone().startOf(timeScale);
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
    const gridOffsetCoefficient = 2.5;
    const offSetGrids = Math.floor(hoverLeftOffset / gridWidth);
    const offSetHalved = Math.floor(Math.floor(numberOfVisibleTiles * gridOffsetCoefficient) / 2);
    const offSetGridsDiff = offSetGrids - Math.floor(numberOfVisibleTiles / 2);
    let gridsToSubtract = offSetHalved + offSetGridsDiff;
    let gridsToAdd = offSetHalved - offSetGridsDiff;

    if (!isYearOrMonth) {
      // determine if changing timeScale from greater to lesser (e.g., 'year' to 'month')
      const greaterToLesserTimescale = timeScale && previousTimeScale
        ? TIME_SCALE_TO_NUMBER[timeScale] < TIME_SCALE_TO_NUMBER[previousTimeScale]
        : null;

      if (greaterToLesserTimescale) {
        // determine how far hoverTime date is from end to compensate for bounds correction
        const hoverTimeToEndDateLimit = moment.utc(timelineEndDateLimit).diff(hoverTimeDate, timeScale);
        if (hoverTimeToEndDateLimit < offSetHalved) {
          gridsToSubtract = gridsToSubtract + (offSetHalved - hoverTimeToEndDateLimit) - offSetGrids;
          gridsToAdd = gridsToAdd - (offSetHalved - hoverTimeToEndDateLimit) + offSetGrids;
        }
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
    if (timeScale === 'year') {
      position = timelineAxisWidth / 2 + (hoverLeftOffset - timelineAxisWidth / 2);
    } else if (timeScale === 'month') {
      const pixelsToAddToDraggerNew = Math.abs(frontDate.diff(hoverTimeDate, timeScale, true) * gridWidth);
      const positionModified = pixelsToAddToDraggerNew - pixelsToAdd + 2;
      position = timelineAxisWidth / 2 + (hoverLeftOffset - timelineAxisWidth / 2) - positionModified;
    } else {
      // - (offSetGridsDiff * gridWidth) to compensate off center zooming repositioning
      position = midPoint - (timelineAxisWidth / 2 - hoverLeftOffset).toFixed(10) - offSetGridsDiff * gridWidth;
      if (gridNumber % 2 !== 0) { // handle odd number gridNumber grid offset
        position += gridWidth / 2;
      }
    }

    // get axis bounds
    const diffFromStartDateLimit = hoverTimeDate.diff(timelineStartDateLimit, timeScale);
    const diffFromEndDateLimit = frontDate.diff(timelineEndDateLimit, timeScale);
    let leftBound = diffFromEndDateLimit * gridWidth + midPoint / 3 + timelineAxisWidth;
    let rightBound = diffFromStartDateLimit * gridWidth + midPoint * 1.5 + timelineAxisWidth * 0.25;

    if (isYearOrMonth) {
      leftBound = diffFromEndDateLimit * gridWidth + pixelsToAdd + 2 + timelineAxisWidth * 0.8;
      rightBound = timelineAxisWidth * 0.25 + pixelsToAdd + 2;
    }

    // handle position being set beyond bounds due to edge dates not precisely scaling to other timescales
    let boundsDiff = 0;
    if (rightBound < position) {
      const rightBoundDiff = position - rightBound;
      rightBound += rightBoundDiff;
      boundsDiff -= rightBoundDiff;
    } else if (leftBound > position) {
      const leftBoundDiff = leftBound - position;
      leftBound -= leftBoundDiff;
      boundsDiff += leftBoundDiff;
    }

    // update transform and dragger positioning based on calculated offsets
    const transformX = boundsDiff - pixelsToAdd - 2;
    const animationStartLocation = animationStartDraggerLocation + position + transformX;
    const animationEndLocation = animationEndDraggerLocation + position + transformX;
    draggerPosition = draggerPosition - pixelsToAdd + position - draggerWidth + boundsDiff;
    draggerPositionB = draggerPositionB - pixelsToAdd + position - draggerWidth + boundsDiff;
    const updatePositioningArguments = {
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
      animationEndLocation,
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
      wheelZoom: false,
      hitLeftBound: false,
      hitRightBound: false,
      updatedTimeScale: true,
    }, updatePositioning(updatePositioningArguments, isYearOrMonth ? hoverTime : hoverTimeString));
  };

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
      timeScale,
    } = this.props;
    let dayZeroed;
    let startDate;
    let endDate;

    // year and month are static - full range
    const isYearOrMonth = timeScale === 'year' || timeScale === 'month';
    if (isYearOrMonth) {
      const startLimitYear = new Date(timelineStartDateLimit).getUTCFullYear();
      dayZeroed = moment.utc(inputDate).startOf('year');
      startDate = dayZeroed.year(startLimitYear);
      if (timeScale === 'year') {
        const endLimitYear = new Date(timelineEndDateLimit).getUTCFullYear() + 1;
        endDate = dayZeroed.clone().year(endLimitYear);
      } else if (timeScale === 'month') {
        endDate = moment.utc(timelineEndDateLimit).startOf('month').add(1, 'month');
      }
    } else {
      if (timeScale === 'day') {
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
      timelineEndDateLimit,
    );
    return timeRangeArray;
  };

  /**
  * @desc update dates in range based on dragging axis
  * @param {Number} position
  * @param {Number} deltaX
  * @param {Number} draggerPosition
  * @param {Number} draggerPositionB
  * @param {Number} overDrag
  * @returns {Object} output - return new time range and dragger visibility/updated position
  * @returns {Array} output.currentTimeRange
  * @returns {Number} output.transformX
  * @returns {Boolean} output.draggerVisible
  * @returns {Boolean} output.draggerVisibleB
  * @returns {Number} output.overDragGrids
  * @returns {Number} output.newDraggerPosition
  * @returns {Number} output.newDraggerPositionB
  */
  updateTimeRangeFromDrag = (position, deltaX, draggerPosition, draggerPositionB, overDrag) => {
    const {
      gridWidth,
      currentTimeRange,
      numberOfVisibleTiles,
    } = this.state;
    const {
      transformX,
      draggerVisible,
      draggerVisibleB,
      draggerTimeState,
      draggerTimeStateB,
      isCompareModeActive,
      draggerSelected,
    } = this.props;
    // get updated visible tiles with over drag
    const updatedNumberOfVisibleTiles = Math.floor(numberOfVisibleTiles * 0.25);
    const overDragGrids = Math.ceil(overDrag / gridWidth);
    const numVisibleTilesWithOverDrag = updatedNumberOfVisibleTiles + 1 + overDragGrids;
    const newCurrentTimeRange = currentTimeRange;
    let timeRangeAdd;
    let transform;
    if (deltaX > 0) { // dragging right - exposing past dates
      const firstDateInRange = newCurrentTimeRange[0].rawDate;
      timeRangeAdd = this.getTimeRangeArray(numVisibleTilesWithOverDrag, -1, firstDateInRange);
      removeBackMultipleInPlace(newCurrentTimeRange, numVisibleTilesWithOverDrag);
      newCurrentTimeRange.unshift(...timeRangeAdd);
      transform = transformX - numVisibleTilesWithOverDrag * gridWidth;
    } else { // dragging left - exposing future dates
      const lastDateInRange = newCurrentTimeRange[newCurrentTimeRange.length - 1].rawDate;
      timeRangeAdd = this.getTimeRangeArray(-1, numVisibleTilesWithOverDrag, lastDateInRange);
      removeFrontMultipleInPlace(newCurrentTimeRange, numVisibleTilesWithOverDrag);
      newCurrentTimeRange.push(...timeRangeAdd);
      transform = transformX + numVisibleTilesWithOverDrag * gridWidth;
    }

    // check if dragger is in between range and visible
    const frontDate = newCurrentTimeRange[0].rawDate;
    const backDate = newCurrentTimeRange[newCurrentTimeRange.length - 1].rawDate;

    // default to input dragger positions in the event of no updates
    let newDraggerPosition = draggerPosition;
    let newDraggerPositionB = draggerPositionB;
    let newDraggerVisible = draggerVisible;
    let newDraggerVisibleB = draggerVisibleB;

    const sharedDraggerVisibilityParams = {
      frontDate,
      backDate,
      position,
      transform,
    };

    // check selected dragger (or both if compare mode) for visibility and new position
    if (draggerSelected === 'selected' || isCompareModeActive) { // dragger A selected
      const draggerACheck = this.checkDraggerVisibility(
        draggerTimeState,
        draggerVisible,
        newDraggerPosition,
        sharedDraggerVisibilityParams,
      );
      newDraggerVisible = draggerACheck.isVisible;
      newDraggerPosition = draggerACheck.newDraggerPosition;
    }

    if (draggerSelected === 'selectedB' || isCompareModeActive) { // dragger B selected
      const draggerBCheck = this.checkDraggerVisibility(
        draggerTimeStateB,
        draggerVisibleB,
        newDraggerPositionB,
        sharedDraggerVisibilityParams,
      );
      newDraggerVisibleB = draggerBCheck.isVisible;
      newDraggerPositionB = draggerBCheck.newDraggerPosition;
    }

    return {
      newCurrentTimeRange,
      transformX: transform,
      draggerVisible: newDraggerVisible,
      draggerVisibleB: newDraggerVisibleB,
      overDragGrids,
      newDraggerPosition,
      newDraggerPositionB,
    };
  };

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
  * @returns {Object} output - return params used for dragger visibility/updating dragger position
    * @returns {Boolean} output.newDraggerPosition
    * @returns {Boolean} output.isVisible - dragger within visible range
  */
  checkDraggerVisibility = (draggerTime, draggerVisible, newDraggerPosition, {
    frontDate, backDate, position, transform,
  }) => {
    const { gridWidth } = this.state;
    const { timeScale } = this.props;
    const isBetween = getIsBetween(draggerTime, frontDate, backDate);
    let updatedDraggerPosition = newDraggerPosition;
    if (isBetween) {
      if (draggerVisible === false) {
        const frontDateObj = moment.utc(frontDate);
        updatedDraggerPosition = Math.abs(frontDateObj.diff(draggerTime, timeScale, true) * gridWidth) + position + transform - 50;
      }
      return {
        newDraggerPosition: updatedDraggerPosition,
        isVisible: true,
      };
    }
    return {
      newDraggerPosition: updatedDraggerPosition,
      isVisible: false,
    };
  };


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
      isAnimationPlaying,
    } = this.props;
    if (draggerTime !== date || previousDate !== date) {
      if (previousDate === draggerTime) {
        // handle tour url date change
        if (isTourActive && !isAnimationPlaying) {
          this.updateScale(date, timeScale, 0.5);
        } else {
          // handle animation dragger update
          const draggerCheck = this.checkDraggerMoveOrUpdateScale(previousDate, isDraggerB);
          if (!draggerCheck.withinRange) {
            this.updateScaleWithOffset(date, timeScale, draggerCheck.newDateInThePast);
          }
        }
      } else {
        // check if draggerCheck will be within acceptable visible axis width
        const draggerCheck = this.checkDraggerMoveOrUpdateScale(previousDate, isDraggerB);
        if (!draggerCheck.withinRange) {
          this.updateScaleWithOffset(date, timeScale, draggerCheck.newDateInThePast);
        }
      }
    }
  };

  /**
   * @desc check if selectedDate will be within acceptable visible axis width
   * @param {String} previousDate
   * @param {Boolean} isDraggerB - draggerB being checked?
   * @returns {Object} output - return params used for dragger visibility/updating axis
   * @returns {Boolean} output.withinRange - within visible range
   * @returns {Boolean} output.newDateInThePast - new date older than previous date
   */
  checkDraggerMoveOrUpdateScale = (previousDate, isDraggerB) => {
    const {
      appNow,
      dateA,
      dateB,
      draggerPosition,
      draggerPositionB,
      axisWidth,
      frontDate,
      backDate,
    } = this.props;
    let selectedDraggerTimeState;
    let selectedDraggerPosition;

    if (isDraggerB) {
      selectedDraggerTimeState = dateB;
      selectedDraggerPosition = draggerPositionB;
    } else {
      selectedDraggerTimeState = dateA;
      selectedDraggerPosition = draggerPosition;
    }

    // check date is within axis date range
    const previousDateTime = new Date(previousDate).getTime();
    const selectedDraggerDateTime = new Date(selectedDraggerTimeState).getTime();

    const newDateInThePast = selectedDraggerDateTime < previousDateTime;
    const isBeforeFrontDate = selectedDraggerDateTime < new Date(frontDate);
    const isAfterBackDate = selectedDraggerDateTime > new Date(backDate);
    const isDateWithinRange = !isBeforeFrontDate && !isAfterBackDate;

    // check dragger is within axis position range
    const leftEdgeOfVisibleAxis = -26;
    const rightEdgeOfVisibleAxis = axisWidth - 80;
    const isDraggerPositionWithinAxis = selectedDraggerPosition <= rightEdgeOfVisibleAxis
      && selectedDraggerPosition >= leftEdgeOfVisibleAxis;
    let newDraggerWithinRangeCheck = isDraggerPositionWithinAxis && isDateWithinRange;
    if (new Date(backDate) > appNow && selectedDraggerTimeState === getISODateFormatted(appNow)) {
      newDraggerWithinRangeCheck = false;
    }

    return {
      withinRange: newDraggerWithinRangeCheck,
      newDateInThePast,
    };
  };

  /**
  * @desc helper used in componentDidUpdate
  * @desc update scale leftOffset
  * @param {String} date
  * @param {String} timeScale
  * @param {Boolean} draggerCheck.newDateInThePast
  * @returns {void}
  */
  updateScaleWithOffset = (date, timeScale, newDateInThePast) => {
    const leftOffsetFixedCoefficient = newDateInThePast
      ? 0.25
      : 0.75;
    this.updateScale(date, timeScale, leftOffsetFixedCoefficient);
  };

  // #### Drag/mouse handlers ####
  /**
  * @desc show hover line - additional parent conditions required
  * @param {Event} mouse event
  * @returns {void}
  */
  showHoverOn = (e) => {
    const { isAnimationDraggerDragging, isTimelineDragging, showHoverOn } = this.props;
    const { updatedTimeScale } = this.state;
    if (updatedTimeScale) {
      this.setState({
        updatedTimeScale: false,
      });
    } else if (!isAnimationDraggerDragging && !isTimelineDragging) {
      if (e.target.className.animVal === 'axis-grid-rect') {
        showHoverOn();
      }
    }
  };

  /**
  * @desc determine wheel type function of scroll or pan
  * y axis change - change timescale (e.g. from 'day' to 'month')
  * x axis change - horizontal scroll multi-touch
  * @param {Event} wheel scroll event
  * @returns {void}
  */
  handleWheelType = (e) => {
    e.persist();
    const { debounceChangeTimeScaleWheel } = this.props;
    const deltaYAbs = Math.abs(e.deltaY);
    const deltaXAbs = Math.abs(e.deltaX);

    // determine more dominant scroll direction for diagonal cases
    const yTypeChangeScroll = deltaYAbs !== 0 && deltaYAbs >= 3 && deltaYAbs > deltaXAbs * 2;
    const xTypeChangePan = deltaXAbs !== 0 && deltaXAbs > deltaYAbs;

    if (yTypeChangeScroll) {
      this.setState({
        wheelZoom: true,
      });
      debounceChangeTimeScaleWheel(e);
    } else if (xTypeChangePan) {
      this.handleWheelPan(e);
    }
  };

  /**
  * @desc changes timeScale with wheel pan
  * allow trailing events (can keep sliding after release)
  * x axis change - horizontal pan multi-touch
  * @param {Event} wheel scroll event
  * @returns {void}
  */
  handleWheelPan(e) {
    const {
      position,
      updateTimelineMoveAndDrag,
    } = this.props;
    const {
      leftBound,
      rightBound,
      hitLeftBound,
      hitRightBound,
    } = this.state;
    const deltaChangeCoefficient = 10;

    // handle horizontal scroll on x axis wheel event
    this.handleStartDrag();
    // multi-touch drag left
    if (e.deltaX > 0) {
      const scrollX = position - deltaChangeCoefficient;
      // cancel drag if exceeds axis leftBound and hitLeftBound flag hit
      if (scrollX < leftBound && hitLeftBound) {
        clearTimeout(this.wheelTimeout);
        updateTimelineMoveAndDrag(false, false);
      } else {
        const deltaObj = {
          deltaX: -deltaChangeCoefficient,
          x: scrollX,
        };

        // if leftBound will be hit with next delta pan
        if (position - deltaChangeCoefficient * 2 < leftBound) {
          updateTimelineMoveAndDrag(false, false);
          this.setState({
            hitLeftBound: true,
          });
        } else {
          // drag and update positioning
          this.handleDrag(e, deltaObj);
          clearTimeout(this.wheelTimeout);
          this.wheelTimeout = setTimeout(() => {
            this.handleStopDrag(null, deltaObj, true);
          }, 20);
        }
      }
    // multi-touch drag right
    } else {
      const scrollX = position + deltaChangeCoefficient;
      // cancel drag if exceeds axis rightBound and hitRightBound flag hit
      if (scrollX > rightBound && hitRightBound) {
        clearTimeout(this.wheelTimeout);
        updateTimelineMoveAndDrag(false, false);
      } else {
        const deltaObj = {
          deltaX: deltaChangeCoefficient,
          x: scrollX,
        };

        // if leftBound will be hit with next delta pan
        if (position + deltaChangeCoefficient * 2 > rightBound) {
          updateTimelineMoveAndDrag(false, false);
          this.setState({
            hitRightBound: true,
          });
        } else {
          // drag and update positioning
          this.handleDrag(e, deltaObj);
          clearTimeout(this.wheelTimeout);
          this.wheelTimeout = setTimeout(() => {
            this.handleStopDrag(null, deltaObj, true);
          }, 20);
        }
      }
    }
  }

  /**
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
      clientXOnDrag: clientX,
    });
  };

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
    const { clientXOnDrag } = this.state;
    const { clientX } = e;
    if (clientX === clientXOnDrag) {
      const {
        currentTimeRange,
      } = this.state;
      const {
        isCompareModeActive,
        draggerSelected,
        draggerTimeState,
        draggerTimeStateB,
        hoverTime,
        updateDraggerDatePosition,
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
      updateDraggerDatePosition(hoverTime, draggerSelected, null, true, otherDraggerVisible, false);
    }
  };

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
    const { clientXOnDrag } = this.state;
    // get x coordinate for touch event
    const touch = e.changedTouches[0];
    const clientX = touch.pageX;
    if (clientX === clientXOnDrag) {
      const {
        currentTimeRange,
      } = this.state;
      const {
        isCompareModeActive,
        draggerSelected,
        draggerTimeState,
        draggerTimeStateB,
        timeScale,
        position,
        transformX,
        parentOffset,
        updateDraggerDatePosition,
      } = this.props;
      // front/back dates for calculating new date and checking if other dragger is visible
      const frontDate = currentTimeRange[0].rawDate;
      const backDate = currentTimeRange[currentTimeRange.length - 1].rawDate;

      // timescale specific options
      const options = timeScaleOptions[timeScale].timeAxis;
      const { gridWidth } = options;
      const diffZeroValues = options.scaleMs;

      // calculate position of touch click relative to front date
      const positionRelativeToFront = clientX - parentOffset - position - transformX - 2;

      // determine approximate new dragger date and coefficient based on grid width
      const gridWidthCoefficient = positionRelativeToFront / gridWidth;
      const gridWidthCoefficientRemainder = gridWidthCoefficient - Math.floor(gridWidthCoefficient);
      const draggerDateAdded = moment.utc(frontDate).add(Math.floor(gridWidthCoefficient), timeScale);

      // get ms time value
      const draggerDateAddedValue = new Date(draggerDateAdded).getTime();
      let newDraggerTime;
      if (!diffZeroValues) { // unknown scaleMs due to varying number of days per month and year (leap years)
        let daysCount;
        if (timeScale === 'year') {
          daysCount = draggerDateAdded.isLeapYear() ? 366 : 365;
        } else if (timeScale === 'month') {
          daysCount = draggerDateAdded.daysInMonth();
        }
        // days times milliseconds in day times remainder
        const remainderMilliseconds = daysCount * 86400000 * gridWidthCoefficientRemainder;
        newDraggerTime = Math.floor(draggerDateAddedValue + remainderMilliseconds);
      } else { // known scaleMs (e.g. 86400000 for day)
        newDraggerTime = draggerDateAddedValue + (diffZeroValues * gridWidthCoefficientRemainder);
      }

      // check other dragger visibility on update
      let otherDraggerVisible;
      if (draggerSelected === 'selected') {
        // check Dragger B visibility and then update Dragger A
        otherDraggerVisible = isCompareModeActive && getIsBetween(draggerTimeStateB, frontDate, backDate);
      } else {
        // check Dragger A visibility and then update Dragger B
        otherDraggerVisible = isCompareModeActive && getIsBetween(draggerTimeState, frontDate, backDate);
      }
      updateDraggerDatePosition(newDraggerTime, draggerSelected, null, true, otherDraggerVisible, false);
    }
  };

  /**
  * @desc handle start drag of axis sets dragging state
  * @returns {void}
  */
  handleStartDrag = () => {
    const {
      isTimelineDragging,
      updateTimelineMoveAndDrag,
    } = this.props;
    if (!isTimelineDragging) {
      updateTimelineMoveAndDrag(true);
    }
  };

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
      dragSentinelCount,
    } = this.state;
    const {
      timeScale,
      updatePositioning,
      updatePositioningOnSimpleDrag,
    } = this.props;
    let {
      position,
      animationStartLocation,
      animationEndLocation,
      draggerPosition,
      draggerPositionB,
    } = this.props;

    const { deltaX } = d;
    position += deltaX;
    draggerPosition += deltaX;
    draggerPositionB += deltaX;
    animationStartLocation += deltaX;
    animationEndLocation += deltaX;
    // update not necessary for year or month since all units are displayed
    if (timeScale === 'month' || timeScale === 'year') {
      const updateSimplePositioningArguments = {
        position,
        draggerPosition,
        draggerPositionB,
        animationStartLocation,
        animationEndLocation,
      };

      updatePositioningOnSimpleDrag(updateSimplePositioningArguments);
      // handle all timescale other than year and month to add new groups of tile item dates
    } else if (deltaX > 0) {
      // dragging right - exposing past dates
      if (dragSentinelCount + deltaX >= dragSentinelChangeNumber) {
        // handle over drag that necessitates multiple axis updates
        let overDrag = 0;
        if (dragSentinelCount + deltaX >= dragSentinelChangeNumber * 2) {
          overDrag = Math.abs(dragSentinelCount + deltaX - dragSentinelChangeNumber * 2);
        }
        const {
          newCurrentTimeRange,
          transformX,
          draggerVisible,
          draggerVisibleB,
          overDragGrids,
          newDraggerPosition,
          newDraggerPositionB,
        } = this.updateTimeRangeFromDrag(
          position,
          deltaX,
          draggerPosition,
          draggerPositionB,
          overDrag,
        );

        const newDragSentinelCount = dragSentinelCount + deltaX - dragSentinelChangeNumber - overDragGrids * gridWidth;
        const frontDate = newCurrentTimeRange[0].rawDate;
        const backDate = newCurrentTimeRange[newCurrentTimeRange.length - 1].rawDate;
        const updatePositioningArguments = {
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
          animationEndLocation,
        };
        this.setState({
          currentTimeRange: newCurrentTimeRange,
          dragSentinelCount: newDragSentinelCount,
        });
        updatePositioning(updatePositioningArguments);
      } else {
        // reset dragSentinelCount on direction change to remaining distance to dragSentinelChangeNumber
        const newDragSentinelCount = dragSentinelCount < 0
          ? dragSentinelChangeNumber + dragSentinelCount + deltaX
          : dragSentinelCount + deltaX;

        const updatePositioningArguments = {
          position,
          draggerPosition,
          draggerPositionB,
          animationStartLocation,
          animationEndLocation,
        };
        this.setState({
          dragSentinelCount: newDragSentinelCount,
        });
        updatePositioningOnSimpleDrag(updatePositioningArguments);
      }
    } else if (deltaX < 0) {
    // dragging left - exposing future dates
      if (dragSentinelCount + deltaX < -dragSentinelChangeNumber) {
      // handle over drag that necessitates multiple axis updates
        let overDrag = 0;
        if (dragSentinelCount + deltaX < -dragSentinelChangeNumber * 2) {
          overDrag = Math.abs(dragSentinelCount + deltaX + dragSentinelChangeNumber * 2);
        }

        const {
          newCurrentTimeRange,
          transformX,
          draggerVisible,
          draggerVisibleB,
          overDragGrids,
          newDraggerPosition,
          newDraggerPositionB,
        } = this.updateTimeRangeFromDrag(
          position,
          deltaX,
          draggerPosition,
          draggerPositionB,
          overDrag,
        );

        const newDragSentinelCount = dragSentinelCount + deltaX + dragSentinelChangeNumber + overDragGrids * gridWidth;
        const frontDate = newCurrentTimeRange[0].rawDate;
        const backDate = newCurrentTimeRange[newCurrentTimeRange.length - 1].rawDate;
        const updatePositioningArguments = {
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
          animationEndLocation,
        };
        this.setState({
          currentTimeRange: newCurrentTimeRange,
          dragSentinelCount: newDragSentinelCount,
        });
        updatePositioning(updatePositioningArguments);
      } else {
        // reset dragSentinelCount on direction change to remaining distance to dragSentinelChangeNumber
        const newDragSentinelCount = dragSentinelCount > 0
          ? -dragSentinelChangeNumber + dragSentinelCount + deltaX
          : dragSentinelCount + deltaX;

        const updatePositioningArguments = {
          position,
          draggerPosition,
          draggerPositionB,
          animationStartLocation,
          animationEndLocation,
        };
        this.setState({
          dragSentinelCount: newDragSentinelCount,
        });
        updatePositioningOnSimpleDrag(updatePositioningArguments);
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
    const {
      midPoint,
    } = this.state;
    let {
      leftBound,
      rightBound,
    } = this.state;
    const {
      frontDate,
      leftOffset,
      hoverTime,
      position,
      timeScale,
      timelineStartDateLimit,
      timelineEndDateLimit,
      transformX,
      updatePositioningOnAxisStopDrag,
    } = this.props;

    const newPosition = position - midPoint;
    const newTransformX = transformX + newPosition;
    let hasMoved = false;
    // drag left OR drag right
    if (d.x !== midPoint) {
      hasMoved = true;
    }
    if (!wheelZoom) {
      hasMoved = false;
    }
    // new left/right axis bounds
    leftBound += midPoint - d.x;
    rightBound += midPoint - d.x;

    const updatePositioningArguments = {
      isTimelineDragging: false,
      position: midPoint,
      transformX: newTransformX,
    };
    this.setState({
      leftBound,
      rightBound,
      wheelZoom: !!wheelZoom,
    });

    // hoverTime conditional calculation necessary for touch-pad horizontal scroll gesture
    let hoverTimeDate;
    if (hasMoved) {
      const options = timeScaleOptions[timeScale].timeAxis;
      const { gridWidth } = options;
      const diffZeroValues = options.scaleMs;
      const newHoverTimeValue = new Date(frontDate).getTime();
      if (!diffZeroValues) {
        // calculate based on frontDate due to varying number of days per month and per year (leap years)
        const hoverLinePositionRelativeToFrontDate = leftOffset - midPoint - newTransformX;
        const gridWidthCoefficient = hoverLinePositionRelativeToFrontDate / gridWidth;
        const hoverTimeAdded = moment.utc(frontDate).add(gridWidthCoefficient, timeScale);
        let daysCount;
        if (timeScale === 'year') {
          daysCount = hoverTimeAdded.isLeapYear() ? 366 : 365;
        } else if (timeScale === 'month') {
          daysCount = hoverTimeAdded.daysInMonth();
        }
        const gridWidthCoefficientRemainder = gridWidthCoefficient - Math.floor(gridWidthCoefficient);
        const remainderMilliseconds = daysCount * 86400000 * gridWidthCoefficientRemainder;
        hoverTimeDate = getISODateFormatted(hoverTimeAdded.add(remainderMilliseconds));
      } else {
        // calculate based on known diffZeroValues (days, hours, minutes)
        const diffFactor = diffZeroValues / gridWidth;
        const hoverDelta = (leftOffset - midPoint) / gridWidth;
        hoverTimeDate = getISODateFormatted(newHoverTimeValue + (diffFactor * hoverDelta));
      }
    } else {
      hoverTimeDate = hoverTime;
    }

    // prevent edge case fast scroll/timescale switch over date before/beyond axis coverage
    const timelineStartDateLimitDateObj = new Date(timelineStartDateLimit);
    const timelineEndDateLimitDateObj = new Date(timelineEndDateLimit);
    const hoverTimeDateObj = new Date(hoverTimeDate);

    hoverTimeDate = hoverTimeDateObj > timelineEndDateLimitDateObj
      ? timelineEndDateLimit
      : hoverTimeDateObj < timelineStartDateLimitDateObj
        ? timelineStartDateLimit
        : hoverTimeDate;

    // parent update positioning and hover time
    updatePositioningOnAxisStopDrag(updatePositioningArguments, hoverTimeDate);
  }

  /**
  * @desc get matching coverage line dimensions for given date range
  * @returns {Object} visible, leftOffset, width
  */
  getMatchingCoverageLineDimensions = () => {
    const {
      axisWidth,
      backDate,
      frontDate,
      position,
      transformX,
      timeScale,
      matchingTimelineCoverage,
    } = this.props;
    const {
      startDate,
      endDate,
    } = matchingTimelineCoverage;

    const positionTransformX = position + transformX;
    const { gridWidth } = timeScaleOptions[timeScale].timeAxis;
    const axisFrontDate = new Date(frontDate).getTime();
    const axisBackDate = new Date(backDate).getTime();
    const layerStart = new Date(startDate).getTime();
    const layerEnd = new Date(endDate).getTime();

    let visible = true;
    if (layerStart >= axisBackDate || layerEnd <= axisFrontDate) {
      visible = false;
    }

    let leftOffset = 0;
    const layerStartBeforeAxisFront = layerStart < axisFrontDate;
    const layerEndBeforeAxisBack = layerEnd <= axisBackDate;

    // oversized width allows axis drag buffer
    let width = axisWidth * 2;
    if (visible) {
      if (layerStartBeforeAxisFront) {
        leftOffset = 0;
      } else {
        // positive diff means layerStart more recent than axisFrontDate
        const diff = moment.utc(layerStart).diff(axisFrontDate, timeScale, true);
        const gridDiff = gridWidth * diff;
        leftOffset = gridDiff + positionTransformX;
      }

      if (layerEndBeforeAxisBack) {
        // positive diff means layerEnd earlier than back date
        const diff = moment.utc(layerEnd).diff(axisFrontDate, timeScale, true);
        const gridDiff = gridWidth * diff;
        width = Math.max(gridDiff + positionTransformX - leftOffset, 0);
      }
    }

    return {
      visible,
      leftOffset,
      width,
    };
  };

  /**
  * @desc get DOM coverage line
  * @param {Object} lineCoverageOptions
  * @param {Number} transformX
  * @returns {Object} DOM SVG object
  */
  createMatchingCoverageLineDOMEl = (lineCoverageOptions, transformX) => {
    const { leftOffset, visible, width } = lineCoverageOptions;
    return (
      <g
        className="axis-matching-layer-coverage-line"
        transform={`translate(${-transformX})`}
        clipPath="url(#matchingCoverage)"
      >
        <rect
          style={{
            left: leftOffset,
            visibility: visible ? 'visible' : 'hidden',
            margin: '0 0 6px 0',
          }}
          rx={0}
          ry={0}
          width={width}
          height={10}
          transform={`translate(${transformX + leftOffset})`}
          fill="rgba(0, 119, 212, 0.5)"
          stroke="rgba(0, 69, 123, 0.8)"
          strokeWidth={3}
        />
      </g>
    );
  };

  render() {
    const {
      axisWidth,
      timeScale,
      position,
      transformX,
      showHover,
      showHoverOff,
      matchingTimelineCoverage,
    } = this.props;
    const {
      currentTimeRange,
      gridWidth,
      leftBound,
      rightBound,
    } = this.state;

    // handle matching data coverage panel line dimensions
    let lineCoverageOptions;
    if (!lodashIsEmpty(matchingTimelineCoverage)) {
      lineCoverageOptions = this.getMatchingCoverageLineDimensions();
    }
    const shouldDisplayMatchingCoverageLine = matchingTimelineCoverage && lineCoverageOptions;
    const axisWidthStr = `${axisWidth}px`;

    return (
      <div
        className="timeline-axis-container"
        style={{ width: axisWidthStr }}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.setLineTime}
        onWheel={this.handleWheelType}
        onMouseOver={this.showHoverOn}
        onMouseLeave={showHoverOff}
        onTouchStart={this.handleMouseDown}
        onTouchEnd={this.setLineTimeTouch}
      >
        {currentTimeRange
            && (
              <svg
                className="timeline-axis-svg"
                id="timeline-footer-svg"
                width={axisWidthStr}
                height="64px"
                viewBox={`0 0 ${axisWidth} 64`}
                preserveAspectRatio="xMinYMin slice"
              >
                <defs>
                  {/* clip axis grid text */}
                  <clipPath id="textDisplay">
                    <rect width="84px" height="64px" />
                  </clipPath>
                  {/* clip matching coverage data line */}
                  <clipPath id="matchingCoverage">
                    <rect x={transformX} y="0" width={axisWidthStr} height="64px" />
                  </clipPath>
                  {/* clip axis grid overflow */}
                  <clipPath id="timelineBoundary">
                    <rect x={-position} y="0" width={axisWidthStr} height="64px" />
                  </clipPath>
                  {/* coverage line boundary and background patterns  */}
                  <clipPath id="coverageLineBoundary">
                    <rect x="0" y="0" width={`${axisWidth}px`} height="12" />
                  </clipPath>
                  <pattern
                    id="coverage-line-pattern"
                    x="0"
                    y="0"
                    width="30px"
                    height="12px"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <rect fill="rgb(0, 69, 123)" width="30px" height="12px" x="0" y="0" />
                    <line stroke="#164e7a" strokeWidth="30px" y1="12" />
                  </pattern>
                  <pattern
                    id="coverage-line-pattern-hidden"
                    x="0"
                    y="0"
                    width="30px"
                    height="12px"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <rect fill="rgb(116, 116, 116)" width="30px" height="12px" x="0" y="0" />
                    <line stroke="#797979" strokeWidth="30px" y1="12" />
                  </pattern>
                </defs>
                {shouldDisplayMatchingCoverageLine
                  && this.createMatchingCoverageLineDOMEl(lineCoverageOptions, transformX) }
                <Draggable
                  axis="x"
                  handle=".axis-grid-container"
                  position={{ x: position, y: 0 }}
                  onDrag={this.handleDrag}
                  onStart={this.handleStartDrag}
                  onStop={this.handleStopDrag}
                  bounds={{
                    left: leftBound, top: 0, bottom: 0, right: rightBound,
                  }}
                >
                  <g clipPath="url(#timelineBoundary)">
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
            )}
      </div>
    );
  }
}

TimelineAxis.propTypes = {
  animationEndLocation: PropTypes.number,
  animationStartLocation: PropTypes.number,
  animEndLocationDate: PropTypes.object,
  animStartLocationDate: PropTypes.object,
  appNow: PropTypes.object,
  axisWidth: PropTypes.number,
  backDate: PropTypes.string,
  dateA: PropTypes.string,
  dateB: PropTypes.string,
  debounceChangeTimeScaleWheel: PropTypes.func,
  draggerPosition: PropTypes.number,
  draggerPositionB: PropTypes.number,
  draggerSelected: PropTypes.string,
  draggerTimeState: PropTypes.string,
  draggerTimeStateB: PropTypes.string,
  draggerVisible: PropTypes.bool,
  draggerVisibleB: PropTypes.bool,
  frontDate: PropTypes.string,
  hasFutureLayers: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  hoverTime: PropTypes.string,
  isAnimationDraggerDragging: PropTypes.bool,
  isAnimationPlaying: PropTypes.bool,
  isAnimatingToEvent: PropTypes.bool,
  isCompareModeActive: PropTypes.bool,
  isDraggerDragging: PropTypes.bool,
  isTimelineDragging: PropTypes.bool,
  isTourActive: PropTypes.bool,
  leftOffset: PropTypes.number,
  matchingTimelineCoverage: PropTypes.object,
  onDateChange: PropTypes.func,
  parentOffset: PropTypes.number,
  position: PropTypes.number,
  showHover: PropTypes.func,
  showHoverOff: PropTypes.func,
  showHoverOn: PropTypes.func,
  timelineEndDateLimit: PropTypes.string,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  transformX: PropTypes.number,
  updateDraggerDatePosition: PropTypes.func,
  updatePositioning: PropTypes.func,
  updatePositioningOnAxisStopDrag: PropTypes.func,
  updatePositioningOnSimpleDrag: PropTypes.func,
  updateTimelineMoveAndDrag: PropTypes.func,
};

export default TimelineAxis;
