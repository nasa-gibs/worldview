import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import Deque from 'double-ended-queue';
import moment from 'moment';

import GridRange from './grid-range/grid-range';
import Dragger from './timeline-dragger';

import dateCalc from './date-calc';


// const timeScales = [ 'minute', 'hour', 'day', 'month', 'year' ];
const timeScales = [ 'year', 'month', 'day', 'hour', 'minute' ];
const draggerWidth = 49;

//? can set gridWidth, actual daeArrays (assume length will vary? - minute level will be more individual DOM els than day for example)
const timeScaleOptions = {
  'minute': {
    timeAxis: {
      scale: 'minute',
      gridWidth: 12,
      scaleMs: 60000
    }
  },
  'hour': {
    timeAxis: {
      scale: 'hour',
      gridWidth: 20,
      scaleMs: 3600000
    }
  },
  'day': {
    timeAxis: {
      scale: 'day',
      gridWidth: 12,
      scaleMs: 86400000
    }
  },
  'month': {
    timeAxis: {
      scale: 'month',
      gridWidth: 12,
      scaleMs: null
      // scaleMs: 2678400000 - REFERENCE ONLY - 31 days
    }
  },
  'year': {
    timeAxis: {
      scale: 'year',
      gridWidth: 12,
      scaleMs: null
      // scaleMs: 31536000000 - REFERENCE ONLY - 365 days
    }
  }
};

class TimelineAxis extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDraggerTime: false,
      dragSentinelCount: 0,
      draggerPosition: 0,
      draggerVisible: true,
      draggerPositionB: 0,
      draggerVisibleB: true,
      moved: false,
      deque: null,
      hoverTime: null,
      showHoverLine: false,
      draggerTimeState: null,
      draggerTimeStateB: null,
      leftOffset: 0,
      // selectedDate: this.props.selectedDate, // center of viewport unless restricted by being start/end of available time
      position: -2500,
      currentDateRange: null,
      currentTransformX: 0,
      gridWidth: 100,
      pastDateLimit: '1940-01-01T00:00:00.000',
      futureDateLimit: '2020-01-01T00:00:00.000',
    }
  }
  //? how do position and transforms change between scale changes? lock into one line would be ideal
  updateScale = (inputDate, timeScale, axisWidthInput, leftOffsetFixedCoeff) => {
    let maxDateTEMP = moment.utc(new Date());
    let options = timeScaleOptions[timeScale].timeAxis;
    let gridWidth = options.gridWidth;
    let axisWidth = axisWidthInput ? axisWidthInput : this.props.axisWidth;
    let leftOffset = leftOffsetFixedCoeff ? axisWidth * leftOffsetFixedCoeff : this.state.leftOffset;

    if (leftOffset === 0) {
      leftOffset = axisWidth / 2;
    }

    console.log(leftOffset, this.state.draggerPosition)

    let numberOfVisibleTiles = Number((axisWidth / gridWidth).toFixed(8));
    let gridNumber = Math.floor(numberOfVisibleTiles * 1.5); // should get from state?
    let dragSentinelChangeNumber = gridWidth * (Math.floor(numberOfVisibleTiles * 0.25) + 1);
    if (timeScale === 'year') {
      gridNumber = 2020 - 1940;
    }

    // Floating point issues need to be handled more cleanly
    let midPoint = -((gridWidth * gridNumber) / 2) + ((numberOfVisibleTiles / 2) * gridWidth);
    let hoverTime = moment.utc(this.state.hoverTime);

    if (hoverTime.isAfter(maxDateTEMP)) {
      hoverTime = maxDateTEMP;
    }

    hoverTime = inputDate ? moment.utc(inputDate) : hoverTime;
    // console.log(hoverTime.format())
    let hoverTimeZero;
    let hoverTimeNextZero;

    let draggerDateActual = moment.utc(inputDate ? inputDate : this.state.draggerTimeState);
    console.log(draggerDateActual)
    let draggerDateActualB = moment.utc(this.state.draggerTimeStateB);

    if (timeScale === 'minute') {
      hoverTimeZero = hoverTime.clone().startOf('minute');
      hoverTimeNextZero = hoverTimeZero.clone().add(1, timeScale);
    }
    if (timeScale === 'hour') {
      hoverTimeZero = hoverTime.clone().startOf('hour');
      hoverTimeNextZero = hoverTimeZero.clone().add(1, timeScale);
    }
    if (timeScale === 'day') {
      hoverTimeZero = hoverTime.clone().startOf('day');
      hoverTimeNextZero = hoverTimeZero.clone().add(1, timeScale);
    }
    if (timeScale === 'month') {
      hoverTimeZero = hoverTime.clone().startOf('month');
      hoverTimeNextZero = hoverTimeZero.clone().add(1, timeScale);
    }
    if (timeScale === 'year') {
      hoverTimeZero = moment.utc(this.state.pastDateLimit);
      hoverTimeNextZero = hoverTimeZero.clone().add(1, timeScale);
    }

    // value of hover time, hover time timeunit zeroed, hover time next unit timeunit zeroed
    let hoverTimeValue = hoverTime.valueOf();
    let hoverTimeZeroValue = hoverTimeZero.valueOf();
    let hoverTimeNextZeroValue = hoverTimeNextZero.valueOf();

    let diffZeroValues = hoverTimeNextZeroValue - hoverTimeZeroValue;
    let diffFactor = diffZeroValues / gridWidth;
    let diffStartAndZeroed = hoverTimeValue - hoverTimeZeroValue;

    let pixelsToAdd = diffStartAndZeroed / diffFactor;

    //! offset grids needed since each zoom in won't be centered
    //! maybe non equal past/future dates - this.getDateArray(80, 40, timeScale, hoverTime);
    //! additional offset needed for midPoint and/or position
    let offSetGrids = Math.floor(leftOffset / gridWidth);
    let offSetGridsDiff = offSetGrids - Math.floor(numberOfVisibleTiles / 2);
    // console.log(offSetGrids, leftOffset / gridWidth,  offSetGridsDiff, offSetGrids - (numberOfVisibleTiles / 2))
    let gridsToSubtract = Math.floor(gridNumber/2) + offSetGridsDiff;
    let gridsToAdd = Math.floor(gridNumber/2) - offSetGridsDiff;

    // console.log(Math.floor(gridNumber/2), offSetGrids, gridNumber/2)
    //# MOST EXPENSIVE FUNCTION!!!! Greater the gridNumber === longer. 960 els ~23ms vs 100 at 3.5ms)
    let current = this.getDateArray(gridsToSubtract, gridsToAdd, timeScale, hoverTime);
    // console.log(current)
    let deque = new Deque(current.dates);

    //# NEED FUNCTION TO CHECK IF DRAGGER IS WITHIN RANGE
    //# get front and back dates
    let frontDate = moment.utc(deque.peekFront().rawDate);
    let backDate = moment.utc(deque.peekBack().rawDate);
    // console.log(frontDate.format())
    // check if dragger date is between front/back dates, null set to ignore granularity (go to ms), [] for inclusive of front/back dates
    let isBetween = draggerDateActual.isBetween(frontDate, backDate, null, '[]');
    // let pixelsToAddToDragger = 0;
    let draggerPosition = 0;
    let draggerVisible = false;
    if (isBetween) {
      draggerPosition = Math.abs(frontDate.diff(draggerDateActual, timeScale, true) * gridWidth);
      draggerVisible = true;
    }

    let draggerPositionB = 0;
    let draggerVisibleB = false;
    // let pixelsToAddToDraggerB = 0;
    if (this.props.compareModeActive) {
      let isBetweenB = draggerDateActualB.isBetween(frontDate, backDate, null, '[]');
      if (isBetweenB) {
        draggerPositionB = Math.abs(frontDate.diff(draggerDateActualB, timeScale, true) * gridWidth);
        draggerVisibleB = true;
      }
    }

    let position;
    //# axisWidthInput conditional in place to handle resize centering of position
    if (axisWidthInput) {
      position = midPoint;
    } else {
      //  - (offSetGridsDiff * gridWidth) to compensate off center zooming repositioning
      position = +(midPoint - (axisWidth / 2 - leftOffset)).toFixed(10) - (offSetGridsDiff * gridWidth);
      if (gridNumber % 2 !== 0) {
        position += gridWidth/2;
      }
    }
    // console.log(pixelsToAddToDragger, midPoint, (axisWidth / 2 - leftOffset), pixelsToAdd, position)

    if (timeScale === 'year') {
      position = 0 + axisWidth / 2 + (leftOffset - axisWidth / 2);
    }
    let currentTransformX = 0;
    //? this.addLine(...) added as a callback in this.setState due to relying on changed timescale/grid state
    //? can change later if passing more arguments is more performant or required due to asynchronous behavior of setState
    // console.log(midPoint, position, pixelsToAdd, leftOffset);
    // console.log(pixelsToAdd)
    this.setState({
      draggerTimeState: draggerDateActual.format(),
      draggerPosition: draggerPosition - pixelsToAdd + position - draggerWidth,
      draggerVisible: draggerVisible,
      draggerPositionB: draggerPositionB - pixelsToAdd + position - draggerWidth,
      draggerVisibleB: draggerVisibleB,
      deque: deque,
      currentDateRange: current.dates,
      currentTransformX: currentTransformX,
      gridNumber: gridNumber,
      gridWidth: gridWidth,
      numberOfVisibleTiles: numberOfVisibleTiles,
      moved: false,
      dragSentinelChangeNumber: dragSentinelChangeNumber,
      // # WHY - 2 OFFSET ISSUE WITH POSITION?
      position: position - pixelsToAdd - 2,
      midPoint: position,
      dragSentinelCount: 0,
      showHoverLine: false
    })
  }

  getDraggerPosition = (draggerTime, frontDate, timeScale, gridWidth) => {
    return Math.abs(moment.utc(frontDate).diff(moment.utc(draggerTime), timeScale, true) * gridWidth);
  }

  // changes timeScale state
  wheelZoom = (e) => {
    // e.preventDefault(); //TODO: investigate treated as passive event error/warning when on
    let arrayIndex = timeScales.indexOf(this.props.timeScale);
    let maxIndex = this.props.hasSubdailyLayers ? 4 : 2;
    if (e.deltaY > 0) { // wheel zoom out
      if (arrayIndex > 0) {
        let nextGreaterTimeScale = timeScales[arrayIndex - 1];
        this.props.changeTimescale(nextGreaterTimeScale);
      }
    } else {
      if (arrayIndex < maxIndex) { // wheel zoom in
        let nextSmallerTimeScale = timeScales[arrayIndex + 1];
        this.props.changeTimescale(nextSmallerTimeScale);
      }
    }
  }

  handleDrag = (e, d) => {
    e.stopPropagation();
    e.preventDefault();
    // const startTime = performance.now();
    // var deltaX = d.deltaX || e.movementX; //# NOT THE SAME
    var deltaX = d.deltaX;
    // prevent over dragging
    //! CAUSES AXIS JUMP - need to refine OR make pre/post grid tile buffers larger
    // if (deltaX > 0) {
    //   deltaX = Math.min(this.state.gridWidth * 3, deltaX);
    // } else if (deltaX < 0) {
    //   deltaX = Math.max(-this.state.gridWidth * 3, deltaX);
    // }
    let position = this.state.position + deltaX;
    let timeScale = this.props.timeScale;
    let gridWidth = this.state.gridWidth;
    let draggerPosition = this.state.draggerPosition + deltaX;
    let draggerPositionB = this.state.draggerPositionB + deltaX;
    let dragSentinelChangeNumber = this.state.dragSentinelChangeNumber;
    let dragSentinelCount = this.state.dragSentinelCount;
    //# PRE/POST GRIDARRAY UPDATE NOT NECESSARY FOR YEAR SINCE ALL YEARS DISPLAYED
    if (timeScale === 'year') {
      this.setState({
        draggerPosition: draggerPosition,
        draggerPositionB: draggerPositionB,
        position: position,
        dragSentinelCount: dragSentinelCount + deltaX
      });
    } else {

    // TODO: preChange and postChange interaction if user drags left then right, etc. - gridmovement is key
    // TODO: need to think of flexible use cases for gridMovement, changing preChange, and should make components absolute positioned to zero out
      if (deltaX > 0) { // dragging right - exposing past dates
        if ((dragSentinelCount + deltaX) > dragSentinelChangeNumber) {

          let overDrag = 0;
          if ((dragSentinelCount + deltaX) > dragSentinelChangeNumber + dragSentinelChangeNumber) {
            overDrag = Math.abs((dragSentinelCount + deltaX) - dragSentinelChangeNumber - dragSentinelChangeNumber);
          }
          let { currentDateRange,
                           deque,
               currentTransformX,
                  draggerVisible,
                 draggerVisibleB,
                   overDragGrids,
          draggerPositionRevision } = this.updatePanelDateRange(position, timeScale, deltaX, draggerPosition, overDrag);

          this.setState(() => ({
            currentDateRange: currentDateRange,
            deque: deque,
            currentTransformX: currentTransformX,
            dragSentinelCount: (dragSentinelCount + deltaX) - dragSentinelChangeNumber - (overDragGrids * gridWidth),
            // draggerPosition: draggerPositionRevision,
            draggerPosition: draggerPositionRevision,
            draggerVisible: draggerVisible,
            draggerPositionB: draggerPositionB,
            draggerVisibleB: draggerVisibleB,
            position: position,
            showHoverLine: false
          }));
        } else {
          // reset dragSentinelCount on direction change to remaining distance to dragSentinelChangeNumber
          let newDragSentinelCount = dragSentinelCount < 0 ? (dragSentinelChangeNumber + dragSentinelCount + deltaX) : dragSentinelCount + deltaX;
          this.setState(() => ({
            draggerPosition: draggerPosition,
            draggerPositionB: draggerPositionB,
            position: position,
            dragSentinelCount: newDragSentinelCount,
            showHoverLine: false
          }));
        }
      } else if (deltaX < 0) { // dragging left - exposing future dates

//# get dragSentinelCount 'number over dragSentinelChangeNumber' - add to variable to use to supplement below state (dragSentinelCount, postChangePosition)
//# send down to this.updateDatePanelRange as argument
//# use 'number over dragSentinelChangeNumber' to determine how many tiles to add/remove and how to shift transform

//# need to evaluate the trade off of handling ALL tile adds like this vs. current 'dragSentinelChangeNumber' sentinel number

        if ((dragSentinelCount + deltaX) < -dragSentinelChangeNumber) {
          let overDrag = 0;
          if ((dragSentinelCount + deltaX) < -dragSentinelChangeNumber - dragSentinelChangeNumber) {
            overDrag = Math.abs((dragSentinelCount + deltaX) - -dragSentinelChangeNumber - -dragSentinelChangeNumber);
          }
          let { currentDateRange,
                           deque,
               currentTransformX,
                  draggerVisible,
                 draggerVisibleB,
                   overDragGrids,
          draggerPositionRevision } = this.updatePanelDateRange(position, timeScale, deltaX, draggerPosition, overDrag);

          this.setState(() => ({
            currentDateRange: currentDateRange,
            deque: deque,
            currentTransformX: currentTransformX,
            dragSentinelCount: (dragSentinelCount + deltaX) - -dragSentinelChangeNumber + (overDragGrids * gridWidth),
            // draggerPosition: draggerPositionRevision,
            draggerPosition: draggerPositionRevision,
            draggerVisible: draggerVisible,
            draggerPositionB: draggerPositionB,
            draggerVisibleB: draggerVisibleB,
            position: position,
            showHoverLine: false
          }));
        } else {
          // reset dragSentinelCount on direction change to remaining distance to dragSentinelChangeNumber
          let newDragSentinelCount = dragSentinelCount > 0 ? (-dragSentinelChangeNumber + dragSentinelCount + deltaX) : dragSentinelCount + deltaX;
          this.setState(() => ({
            draggerPosition: draggerPosition,
            draggerPositionB: draggerPositionB,
            position: position,
            dragSentinelCount: newDragSentinelCount,
            showHoverLine: false
          }));
        }
      }
    }
  }

  updatePanelDateRange = (position, timeScale, deltaX, draggerPosition, overDrag) => {
    // const startTime = performance.now();
    let gridWidth = this.state.gridWidth;
    let deque = this.state.deque;
    let numberOfVisibleTiles = Math.floor(this.state.numberOfVisibleTiles * 0.25);
    let overDragGrids = Math.ceil(overDrag / gridWidth);
    let draggerVisible = this.state.draggerVisible;
    let draggerVisibleB = this.state.draggerVisibleB;
    let draggerDateActual = moment.utc(this.state.draggerTimeState);
    let dateArrayAdd;
    let dateArray;
    let transform;
    // let overDragGrids = Math.ceil(overDrag / gridWidth);
    // numberOfVisibleTiles = Math.floor(numberOfVisibleTiles * 0.25);
    if (deltaX > 0) { // dragging right - exposing past dates
      // PHASE 1
      let firstDateInRange = moment.utc(deque.peekFront().rawDate);
      dateArrayAdd = this.getDateArray(numberOfVisibleTiles + 1 + overDragGrids, -1, timeScale, firstDateInRange);
      // PHASE 2
      this.removeBackMultipleInPlace(deque, numberOfVisibleTiles + 1 + overDragGrids);
      deque.unshift(...dateArrayAdd.dates);
      dateArray = deque.toArray();
      // PHASE X - can be done in any order
      transform = this.state.currentTransformX - ((numberOfVisibleTiles + 1 + overDragGrids) * gridWidth);
    } else { // dragging left - exposing future dates
      // PHASE 1
      let lastDateInRange = moment.utc(deque.peekBack().rawDate);
      dateArrayAdd = this.getDateArray(-1, numberOfVisibleTiles + 1 + overDragGrids, timeScale, lastDateInRange);
      // PHASE 2
      this.removeFrontMultipleInPlace(deque, numberOfVisibleTiles + 1 + overDragGrids);
      deque.push(...dateArrayAdd.dates);
      dateArray = deque.toArray();
      // PHASE X - can be done in any order
      transform = this.state.currentTransformX + ((numberOfVisibleTiles + 1 + overDragGrids) * gridWidth);
      // transform = this.state.currentTransformX + (this.state.axisWidth); //! WHY NOT AXISWIDTH?
    }

    //# move this into parent function, make asynchronous and run prior to updatePanelDateRange
    //# make smarter for PAST vs FUTURE date changes, front/back dates will ONLY decerease
    //# and increase in certain changes to deque date array
    let frontDate = moment.utc(dateArray[0].rawDate);
    let backDate = moment.utc(dateArray[dateArray.length - 1].rawDate);
    let isBetween = moment.utc(this.state.draggerTimeState).isBetween(frontDate, backDate, null, '[]');
    let draggerPositionRevision = draggerPosition;
    if (isBetween) {
      // let draggerPositionRevision = Math.abs(frontDate.diff(draggerDateActual, timeScale, true) * gridWidth);
      // console.log(draggerPositionRevision)
      if (draggerVisible === false) {
        // draggerPositionRevision = Math.abs(frontDate.diff(draggerDateActual, timeScale, true) * gridWidth);
        draggerPositionRevision = Math.abs(frontDate.diff(draggerDateActual, timeScale, true) * gridWidth) + position + transform - 50;
        // console.log('NOW VISIBLE', draggerPositionRevision)
      }
      draggerVisible = true;
    } else {
      draggerVisible = false;
    }

    // let compareModeOn = this.props.compareModeActive;
    if (this.props.compareModeActive) {
      let isBetweenB = moment.utc(this.state.draggerTimeStateB).isBetween(frontDate, backDate, null, '[]');
      if (isBetweenB) {
        draggerVisibleB = true;
      } else {
        draggerVisibleB = false;
      }
    }

    return {
      currentDateRange: dateArray,
      deque: deque,
      currentTransformX: transform, //gridwidth * # of shifts and pushes
      draggerVisible: draggerVisible,
      draggerVisibleB: draggerVisibleB,
      overDragGrids: overDragGrids,
      draggerPositionRevision: draggerPositionRevision
    }
  }

  // deque extension to pop NUM times
  removeBackMultipleInPlace = (deque, num) => {
    for (let i = 0; i < num; i++) {
      deque.pop();
    }
  }
  // deque extension to shift NUM times
  removeFrontMultipleInPlace = (deque, num) => {
    for (let i = 0; i < num; i++) {
      deque.shift();
    }
  }

  // return array of days based on:
  // subtract - integer (negative numbers selects start date in the future)
  // add - integer (negative numbers selects end date in the past)
  getDateArray = (subtract, add, timeScale, inputDate) => {
    // console.log(subtract, add, timeScale, inputDate)
    let dayZeroed;
    let startDate;
    let endDate;
    let dateArray;

    if (timeScale ==='year') {
      dayZeroed = moment.utc(inputDate).startOf('year');
      startDate = dayZeroed.year(1940);
      endDate = dayZeroed.clone().year(2021);
    } else {
      if (timeScale === 'month') {
        dayZeroed = moment.utc(inputDate).startOf('month');
      } else if(timeScale === 'day') {
        dayZeroed = moment.utc(inputDate).startOf('day');
      } else if(timeScale === 'hour') {
        dayZeroed = moment.utc(inputDate).startOf('hour');
      } else if(timeScale === 'minute') {
        dayZeroed = moment.utc(inputDate).startOf('minute');
      }
      startDate = dayZeroed.clone().subtract(subtract, timeScale);
      endDate = dayZeroed.clone().add(add, timeScale);
    }
    // console.log(inputDate, dayZeroed.format(), startDate.format(), endDate.format(), subtract, add)
    dateArray = dateCalc.getTimeRange(startDate, endDate, timeScale);
    // console.log(dateArray)
    return dateArray;
  }

  // move red line to new position
  setLineTime = (e) => {
    // debugger;
    // console.log(this.props.draggerSelected, this.state.leftOffset, this.props.parentOffset, e.target.className.animVal)
    e.preventDefault();
    e.stopPropagation();
    //TODO: handle stop bubbling up to parent wv-timeline-axis to prevent invoking on clicking draggers
    if (e.target.className.animVal !== 'grid') {
      return
    }
    let m = this.state.moved;
    if (!this.state.moved) {
      console.log(this.props.draggerSelected)
      // TODO: FIX PARENT OFFSET
      let draggerPosition = this.props.draggerSelected === 'selected' ? this.state.leftOffset - draggerWidth : this.state.draggerPosition;
      let draggerPositionB = this.props.draggerSelected === 'selectedB' ? this.state.leftOffset - draggerWidth : this.state.draggerPositionB;

      // determine which dragger is selected

      // is the other dragger visible after clicking and moving then new dragger ?
      let isCompareModeActive = this.props.compareModeActive;
      let draggerB = this.props.draggerSelected === 'selectedB';

      //get front and back dates
      let deque = this.state.deque;
      let frontDate = moment.utc(deque.peekFront().rawDate);
      let backDate = moment.utc(deque.peekBack().rawDate);

      if (draggerB) {
        let draggerDateActual = moment.utc(this.state.draggerTimeStateB);
        let draggerAVisible = isCompareModeActive && draggerDateActual.isBetween(frontDate, backDate, null, '[]');
        console.log(isCompareModeActive, draggerAVisible)
        console.log(this.state.hoverTime)
        this.setState({
          draggerVisible: draggerAVisible,
          draggerVisibleB: true,
          draggerPositionB: draggerPositionB,
          draggerTimeStateB: this.state.hoverTime,
          // selectedDateB: this.state.hoverTime,
          moved: false
        }, this.props.updateDate(this.state.hoverTime, 'selectedB'));
      } else {
        let draggerDateActualB = moment.utc(this.state.draggerTimeStateB);
        let draggerBVisible = isCompareModeActive && draggerDateActualB.isBetween(frontDate, backDate, null, '[]');
        console.log(isCompareModeActive, draggerBVisible)
        this.setState({
          draggerPosition: draggerPosition,
          draggerVisible: true,
          draggerVisibleB: draggerBVisible,
          draggerTimeState: this.state.hoverTime,
          // selectedDate: this.state.hoverTime,
          moved: false
        }, this.props.updateDate(this.state.hoverTime, 'selected'));
      }
    }
  }

  componentDidMount() {
    // console.log(this.props)
    let axisWidth = this.props.axisWidth;
    let timeScale = this.props.timeScale;
    let time = moment.utc(this.props.selectedDate).format();

    let draggerTimeStateB;
    if (this.props.selectedDateB) {
      draggerTimeStateB = moment.utc(this.props.selectedDateB).format();
    }

    //# get timeScale specifics based on props
    let options = timeScaleOptions[timeScale].timeAxis;
    let gridWidth = options.gridWidth; // 12

    //# calculate number of grids viewable based on axisWidth and gridWidth of timeScale
    let numberOfVisibleTiles = Number((axisWidth / gridWidth).toFixed(8));

    // let draggerPosition = tilesTillSelectedDAte * gridWidth - draggerWidth; //# CENTER DRAGGER A
    let draggerVisible = true;

    //# DRAGGER B TESTING POSITION
    let draggerVisibleB = false;
    if (this.props.compareModeActive) {
      draggerVisibleB = true;
    }

    //# times 1.5 is cutting it close (down to 1 grid at leading edge - will continue to test)
    let gridNumber = Math.floor(numberOfVisibleTiles * 1.5);
    let dragSentinelChangeNumber = gridWidth * (Math.floor(numberOfVisibleTiles * 0.25) + 1);

    //# get midPoint for position based on # of tiles and gridWidth
    let midPoint = -((gridWidth * gridNumber) / 2) + (numberOfVisibleTiles / 2 * gridWidth);

    let draggerTime = moment.utc(time);
    let draggerTimeZero = moment.utc(time).startOf(timeScale)
    let draggerTimeNextZero = moment.utc(draggerTime).startOf(timeScale).add(1, timeScale);

    let draggerTimeValue = moment.utc(draggerTime).valueOf();
    let draggerTimeZeroValue = moment.utc(draggerTimeZero).valueOf();
    let draggerTimeNextZeroValue = moment.utc(draggerTimeNextZero).valueOf();

    let diffZeroValues = draggerTimeNextZeroValue - draggerTimeZeroValue;
    let diffFactor = diffZeroValues / gridWidth;
    let diffStartAndZeroed = draggerTimeValue - draggerTimeZeroValue;

    // let pixelsToAdd = diffStartAndZeroed / diffFactor;

    // let selectedDate = moment.utc(time);
    // console.log(selectedDate)
    //# handle date array creation
    let current = this.getDateArray(Math.floor(gridNumber/2), Math.floor(gridNumber/2), timeScale, time);

    let frontDate = moment.utc(current.dates[0].rawDate);
    let draggerPosition = Math.abs(frontDate.diff(draggerTime, timeScale, true) * gridWidth);
    // let draggerPositionB = Math.abs(frontDate.diff(moment.utc(draggerTimeStateBDraggerBTest), timeScale, true) * gridWidth);
    let draggerPositionB = Math.abs(frontDate.diff(moment.utc(draggerTimeStateB), timeScale, true) * gridWidth);


    this.setState({
      deque: new Deque(current.dates),
      // draggerPosition: draggerPosition + pixelsToAdd,
      draggerPosition: draggerPosition + midPoint - draggerWidth,
      draggerVisible: draggerVisible,
      draggerPositionB: draggerPositionB + midPoint - draggerWidth,
      draggerVisibleB: draggerVisibleB,
      numberOfVisibleTiles: numberOfVisibleTiles,
      dragSentinelChangeNumber: dragSentinelChangeNumber,
      // selectedDate: time,
      currentDateRange: current.dates,
      gridWidth: gridWidth,
      draggerTimeState: time,
      // draggerTimeStateB: draggerTimeStateBDraggerBTest,
      draggerTimeStateB: draggerTimeStateB,
      hoverTime: time,
      currentTransformX: 0,
      midPoint: midPoint,
      position: midPoint,
    })
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

/**
 * check if newDraggerDate will be within acceptable visible axis width
 *
 * @param {String} selectedDate
 * @return {Boolean} withinRange
 * @return {Boolean} newDateInThePast
 * @return {Number} newDraggerDiff
 */
  checkDraggerMoveOrUpdateScale = (selectedDate, draggerB) => {
    let draggerTimeState;
    let draggerPosition;

    if (draggerB) {
      draggerTimeState = this.state.draggerTimeStateB;
      draggerPosition = this.state.draggerPositionB;
    } else {
      draggerTimeState = this.state.draggerTimeState;
      draggerPosition = this.state.draggerPosition;
    }

    let timeScale = this.props.timeScale;
    let gridWidth = this.state.gridWidth;

    let selectedDateMoment = moment.utc(selectedDate);
    let draggerDateMoment = moment.utc(draggerTimeState);

    let newDraggerDiff = selectedDateMoment.diff(draggerDateMoment, timeScale, true);
    let newDraggerPosition = draggerPosition + (newDraggerDiff * gridWidth);
    let newDateInThePast = selectedDateMoment < draggerDateMoment;
    let newDraggerWithinRangeCheck = newDraggerPosition <= (this.props.axisWidth - 80) && newDraggerPosition >= -26;

    return {
      withinRange: newDraggerWithinRangeCheck,
      newDateInThePast: newDateInThePast,
      newDraggerDiff: Math.abs(newDraggerDiff)
    };
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log(prevProps.selectedDate, this.props.selectedDate, this.state.selectedDate, prevState.selectedDate)

    // if (this.props.inputChange === true) {
    //   debugger;
    //   this.props.resetInput();
    //   // check if newDraggerDate will be within acceptable visible axis width
    //   let newDraggerDate = this.checkDraggerMoveOrUpdateScale(this.props.selectedDate);
    //   if (newDraggerDate.withinRange) {
    //     this.setDraggerToTime(this.props.selectedDate);
    //   } else {
    //     let leftOffsetFixedCoeff = newDraggerDate.newDraggerDiff > 5 ? 0.5 : newDraggerDate.newDateInThePast ? 0.25 : 0.75;
    //     this.updateScale(this.props.selectedDate, this.props.timeScale, null, leftOffsetFixedCoeff);
    //   }
    // }
    // console.log(this.props.dateFormatted, this.props.dateFormattedB)

    if (this.props.timeScale !== prevProps.timeScale) {
      this.updateScale(null, this.props.timeScale);
    }

    if (this.props.axisWidth !== prevProps.axisWidth) {
      this.updateScale(null, this.props.timeScale, this.props.axisWidth);
    }

    if (this.props.compareModeActive !== prevProps.compareModeActive) {
      // # TURN ON COMPARE MODE
      // determine what dragger is selected/active at the time of turning on
      // set date and visibility for other dragger
      if (this.props.compareModeActive) {
        this.setDraggerToTime(this.props.selectedDate);
        this.setDraggerToTime(this.props.selectedDateB, true);
      } else {
        // # TURN OFF COMPARE MODE
        // determine what dragger is selected/active at the time of turning off
        // set visibility for other dragger, but leave date
        // turn off dragger letter styling A/B
        let draggerSelected = this.props.draggerSelected;
        if (draggerSelected === 'selected') {
          this.setState({
            draggerVisibleB: false
          })
        } else {
          this.setState({
            draggerVisible: false
          })
        }
      }
    }

    // # HANDLE A CHANGE ############
    // # CHANGED CONDITIONAL FROM "&&" TO "||" TO DEBUG LEFT/RIGHT ARROW UPDATE ISSUE
    if (this.props.selectedDate && (this.props.selectedDate !== prevProps.selectedDate ||
      this.state.draggerTimeState !== prevState.draggerTimeState ||
      moment.utc(this.state.draggerTimeState).format() !== moment.utc(prevState.draggerTimeState).format())) {

      // console.log(this.props.selectedDate, prevProps.selectedDate, this.state.hoverTime, this.state.draggerTimeState)
      // console.log(this.state.draggerTimeState, prevState.draggerTimeState)
      // console.log(this.props.dateFormatted, prevProps.dateFormatted)

      if (moment.utc(this.state.draggerTimeState).format() !== moment.utc(this.props.selectedDate).format()) {
      //  && this.state.draggerTimeState !== prevState.draggerTimeState) { // # draggerTimeState condition breaks LEFT/RIGHT arrows
        // check if newDraggerDate will be within acceptable visible axis width
        let newDraggerDate = this.checkDraggerMoveOrUpdateScale(this.props.selectedDate);
        if (newDraggerDate.withinRange) {
          // # this is causing a double update on the dragger - may need a flag to know it is/is not a dragger causing
          // # the change in date - Milliseconds being cleared to ZERO out is causing false inequality for condtional
          // # somewhere in UTIL (maybe?) the subdaily date must be getting zeroed on Seconds and MS
          this.setDraggerToTime(this.props.selectedDate);
        } else {
          let leftOffsetFixedCoeff = newDraggerDate.newDraggerDiff > 5 ? 0.5 : newDraggerDate.newDateInThePast ? 0.25 : 0.75;
          this.updateScale(this.props.selectedDate, this.props.timeScale, null, leftOffsetFixedCoeff);
        }
      }
    }

    // # HANDLE B CHANGE ############
    // # CHANGED CONDITIONAL FROM "&&" TO "||" TO DEBUG LEFT/RIGHT ARROW UPDATE ISSUE
    if (this.props.selectedDateB && (this.props.selectedDateB !== prevProps.selectedDateB ||
      this.state.draggerTimeStateB !== prevState.draggerTimeStateB ||
      moment.utc(this.state.draggerTimeStateB).format() !== moment.utc(prevState.draggerTimeStateB).format())) {
        debugger;
      // console.log(this.props.selectedDateB, prevProps.selectedDateB, this.state.hoverTime, this.state.draggerTimeStateB, prevState.draggerTimeStateB)
      // console.log(this.state.draggerTimeState, prevState.draggerTimeState)

      if (moment.utc(this.state.draggerTimeStateB).format() !== moment.utc(this.props.selectedDateB).format()) {
      //  && this.state.draggerTimeState !== prevState.draggerTimeState) { // # draggerTimeState condition breaks LEFT/RIGHT arrows
        // check if newDraggerDate will be within acceptable visible axis width
        let newDraggerDate = this.checkDraggerMoveOrUpdateScale(this.props.selectedDateB, true);
        if (newDraggerDate.withinRange) {
          this.setDraggerToTime(this.props.selectedDateB, true);
        } else {
          let leftOffsetFixedCoeff = newDraggerDate.newDraggerDiff > 5 ? 0.5 : newDraggerDate.newDateInThePast ? 0.25 : 0.75;
          this.updateScale(this.props.selectedDateB, this.props.timeScale, null, leftOffsetFixedCoeff);
        }
      }
    }
  }

  // move draggerTimeState to inputTime
  setDraggerToTime = (inputTime, draggerB) => {
    // debugger;
    let frontDate = moment.utc(this.state.deque.peekFront().rawDate);
    let backDate = moment.utc(this.state.deque.peekBack().rawDate);
    let draggerTime = draggerB ? this.state.draggerTimeStateB : this.state.draggerTimeState;
    let draggerTimeState = moment.utc(draggerTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
    let draggerTimeStateAdded = moment.utc(inputTime);
    // console.log(draggerTime, draggerTimeState, draggerTimeStateAdded)
    let isBetween = draggerTimeStateAdded.isBetween(frontDate, backDate, null, '[]');
    let draggerVisible = false;
    let newDraggerPosition;
    if (isBetween) {
      draggerVisible = true;
    }
    let gridWidth = this.state.gridWidth;
    let timeScale = this.props.timeScale;
    let pixelsToAddToDragger = Math.abs(frontDate.diff(draggerTimeState, timeScale, true) * gridWidth);
    let pixelsToAddToDraggerNew = Math.abs(frontDate.diff(draggerTimeStateAdded, timeScale, true) * gridWidth);
    let pixelsToAddBasedOnFrontDate = pixelsToAddToDraggerNew - pixelsToAddToDragger;

    let isVisible = draggerB ? this.state.draggerVisibleB : this.state.draggerVisible;
    if (isVisible) {
      let draggerPosition = draggerB ? this.state.draggerPositionB : this.state.draggerPosition;
      newDraggerPosition = draggerPosition + pixelsToAddBasedOnFrontDate;
    } else {
      newDraggerPosition = pixelsToAddToDraggerNew + this.state.position - draggerWidth + this.state.currentTransformX;
    }

    // console.log(this.state.draggerTimeStateB, this.state.draggerPositionB, pixelsToAddBasedOnFrontDate)
    // console.log(newDraggerPosition, draggerVisible, draggerTimeStateAdded.format())

    if (draggerB) {
      this.setState({
        draggerPositionB: newDraggerPosition,
        draggerVisibleB: draggerVisible,
        draggerTimeStateB: draggerTimeStateAdded.format(),
        // selectedDate: draggerTimeStateAdded.format(),
      })
    } else {
      this.setState({
        draggerPosition: newDraggerPosition,
        draggerVisible: draggerVisible,
        draggerTimeState: draggerTimeStateAdded.format(),
        // selectedDate: draggerTimeStateAdded.format(),
      })
    }
  }

  handleStopDrag = (e, d) => {
    // debugger;
    console.log(e,d)

    let midPoint = this.state.midPoint;
    let position = this.state.position - midPoint;
    let moved = false;
    // necesarry for timescale change, d.x and midPoint are off
    // after timeScale change
    console.log(position === 0)
    if (d.x > midPoint) { // drag right
      moved = true;
    } else if(d.x < midPoint) { // drag left
      moved = true;
    }
    console.log(midPoint, position, moved, this.state.currentTransformX + position, this.state.position)
    this.setState({
      moved: moved,
      position: midPoint,
      currentTransformX: this.state.currentTransformX + position,
    })
  }

  displayDate = (date, leftOffset) => {
    requestAnimationFrame(() => {
      this.setState({
        hoverTime: date,
        leftOffset: leftOffset - this.props.parentOffset // relative location from parent bounding box of mouse hover position (i.e. BLUE LINE)
      });
    })
  }

  // handle dragger dragging
  handleDragDragger = (draggerName, e, d) => {
    console.log(e,d, draggerName)
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    requestAnimationFrame(() => {
      // debugger;
      // var deltaX = d.deltaX || e.movementX; //# NOT THE SAME
      var deltaX = d.deltaX;
      let gridWidth = this.state.gridWidth;
      let timeScale = this.props.timeScale;
      let axisWidth = this.props.axisWidth;
      let dragSentinelChangeNumber = this.state.dragSentinelChangeNumber;
      let dragSentinelCount = this.state.dragSentinelCount;

      let time;
      let draggerPosition;
      let draggerASelected = draggerName === 'selected';
      if (draggerASelected) { // 'selected is 'A' dragger
        draggerPosition = this.state.draggerPosition + deltaX;
        time = this.state.draggerTimeState;
      } else { // 'selectedB' is 'B' dragger
        draggerPosition = this.state.draggerPositionB + deltaX;
        time = this.state.draggerTimeStateB;
      }

      // console.log(draggerPosition, time)
      // update redLineTime based on deltaX from state redLineTime
      // TODO: test consistency throught timescales, currently seems off 0.5 on ocassion
      let draggerTime = moment.utc(time);
      let draggerTimeValue = draggerTime.valueOf();
      // only need to calculate difference in time unit for varying timescales - month and year
      let diffZeroValues = timeScaleOptions[timeScale].timeAxis.scaleMs;
      if (!diffZeroValues) {
        let draggerTimeZero = draggerTime.clone().startOf(timeScale);
        let draggerTimeNextZero = draggerTimeZero.clone().add(1, timeScale);

        let draggerTimeZeroValue = draggerTimeZero.valueOf();
        let draggerTimeNextZeroValue = draggerTimeNextZero.valueOf();

        diffZeroValues = draggerTimeNextZeroValue - draggerTimeZeroValue;
      }
      let diffFactor = diffZeroValues / gridWidth;
      let newDraggerTime = moment.utc(draggerTimeValue + (diffFactor * deltaX)).format();

      // handle drag timeline
      if (draggerPosition < -draggerWidth) { // # handle drag timeline towards PAST
        // console.log('drag off view past', deltaX, (dragSentinelCount + deltaX), -dragSentinelChangeNumber)
        let position = this.state.position - deltaX;

        if ((dragSentinelCount + deltaX) < -dragSentinelChangeNumber) {
          // console.log('drag off view past UNSHIFT TILES')
          let overDrag = 0;
          if ((dragSentinelCount + deltaX) < -dragSentinelChangeNumber - dragSentinelChangeNumber) {
            overDrag = Math.abs((dragSentinelCount + deltaX) - -dragSentinelChangeNumber - -dragSentinelChangeNumber);
          }
          //# NEED TO PASS NEGATIVE OF DELTAX FOR UPDATE PANEL
          let { currentDateRange,
                          deque,
              currentTransformX,
                draggerVisible,
                draggerVisibleB,
                  overDragGrids,
              draggerPositionRevision } = this.updatePanelDateRange(position, timeScale, -deltaX, draggerPosition, overDrag);

          this.setState({
            currentDateRange: currentDateRange,
            deque: deque,
            currentTransformX: currentTransformX,
            draggerPosition: -48,
            moved: true,
            position: position,
            dragSentinelCount: (dragSentinelCount + deltaX) - -dragSentinelChangeNumber + (overDragGrids * gridWidth),
          })
        } else {
          let newDragSentinelCount = dragSentinelCount > 0 ? (-dragSentinelChangeNumber + dragSentinelCount + deltaX) : dragSentinelCount + deltaX;

          // NEGATIVE DELTAX
          this.setState({
            draggerPosition: -48,
            moved: true,
            position: position,
            dragSentinelCount: newDragSentinelCount
          })
        }
      } else if (draggerPosition > axisWidth - draggerWidth) { // handle drag timeline towards FUTURE
        // console.log('drag off view future', deltaX)
        let position = this.state.position - deltaX;

        if ((dragSentinelCount + deltaX) > dragSentinelChangeNumber) {

          let overDrag = 0;
          if ((dragSentinelCount + deltaX) > dragSentinelChangeNumber + dragSentinelChangeNumber) {
            overDrag = Math.abs((dragSentinelCount + deltaX) - dragSentinelChangeNumber - dragSentinelChangeNumber);
          }
          //# NEED TO PASS NEGATIVE OF DELTAX FOR UPDATE PANEL
          let { currentDateRange,
                            deque,
                currentTransformX,
                  draggerVisible,
                  draggerVisibleB,
                    overDragGrids,
          draggerPositionRevision } = this.updatePanelDateRange(position, timeScale, -deltaX, draggerPosition, overDrag);

          this.setState({
            currentDateRange: currentDateRange,
            deque: deque,
            currentTransformX: currentTransformX,
            draggerPosition: axisWidth - 50,
            moved: true,
            position: position,
            dragSentinelCount: (dragSentinelCount + deltaX) - dragSentinelChangeNumber - (overDragGrids * gridWidth),
          })

        } else {
          let newDragSentinelCount = dragSentinelCount < 0 ? (dragSentinelChangeNumber + dragSentinelCount + deltaX) : dragSentinelCount + deltaX;

          // POSITIVE DELTAX
          this.setState({
            draggerPosition: axisWidth - 50,
            moved: true,
            position: position,
            dragSentinelCount: newDragSentinelCount
          })
        }
      } else { // handle drag within axis view
        if (draggerASelected) {
          this.setState({
            draggerPosition: draggerPosition,
            draggerTimeState: newDraggerTime,
            moved: true,
          }, this.props.updateDate(newDraggerTime, 'selected'));
        } else {
          this.setState({
            draggerPositionB: draggerPosition,
            draggerTimeStateB: newDraggerTime,
            moved: true,
          }, this.props.updateDate(newDraggerTime, 'selectedB'));
        }
      }
    })
  }

  // select dragger
  selectDragger = (draggerName, e ) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    // let selectionStr = draggerName === 'A' ? 'selected' : 'selectedB'
    if (draggerName !== this.props.draggerSelected) {
      this.props.onChangeSelectedDragger(draggerName)
    }
  }

  showHoverOn = () => {
    if (!this.state.showDraggerTime) {
      this.setState({
        showHoverLine: true
      });
    }
  }

  showHoverOff = () => {
    this.setState({
      showHoverLine: false
    });
  }

  toggleShowDraggerTime = (toggleBoolean) => {
    this.setState({
      showDraggerTime: toggleBoolean,
      showHoverLine: false
    })
  }

  render() {
    // TODO: debug globals added to window temporarily
    window.deque = Deque;
    window.moment = moment;
    // console.log(this.props, this.state);
    return (
      <React.Fragment>
      <div id="wv-timeline-axis"
        style={{width: `${this.props.axisWidth}px`}}
        onMouseUp={(e) => this.setLineTime(e)}
        onWheel={(e) => this.wheelZoom(e)}
        onMouseOver={this.showHoverOn}
        onMouseLeave={this.showHoverOff}
      >
      {this.state.currentDateRange ?
      <svg className="inner"
        id="timeline-footer-svg"
        width={this.props.axisWidth}
        height={70}
        viewBox={`0 0 ${this.props.axisWidth} 75`}
        preserveAspectRatio="none">
        <defs>
          <clipPath id="textDisplay">
            <rect width="200" height="70" />
          </clipPath>
        </defs>
        <g id="wv-rangeselector-case"></g>
        <Draggable
          axis="x"
          onDrag={this.handleDrag.bind(this)}
          position={{ x: this.state.position, y: 0 }}
          onStop={this.handleStopDrag.bind(this)}
        >
        <g>
          <GridRange
            showHoverLine={this.state.showHoverLine}
            timeScale={this.props.timeScale}
            displayDate={this.displayDate}
            gridWidth={this.state.gridWidth}
            dateArray={this.state.currentDateRange}
            transformX={this.state.currentTransformX} />
        </g>
        </Draggable>
        {this.props.draggerSelected === 'selectedB' ?
        <React.Fragment>
          <Dragger
            toggleShowDraggerTime={this.toggleShowDraggerTime}
            handleDragDragger={this.handleDragDragger}
            selectDragger={this.selectDragger}
            compareModeActive={this.props.compareModeActive}
            disabled={true}
            draggerName='selected'
            draggerPosition={this.state.draggerPosition}
            draggerVisible={this.state.draggerVisible}
            transformX={this.state.currentTransformX}
            // draggerSelected={false}
            parentPosition={this.state.position} />
          <Dragger
            toggleShowDraggerTime={this.toggleShowDraggerTime}
            handleDragDragger={this.handleDragDragger}
            selectDragger={this.selectDragger}
            compareModeActive={this.props.compareModeActive}
            disabled={false}
            draggerName='selectedB'
            draggerPosition={this.state.draggerPositionB}
            draggerVisible={this.state.draggerVisibleB}
            transformX={this.state.currentTransformX}
            // draggerSelected={true}
            parentPosition={this.state.position} />
        </React.Fragment>
        :
        <React.Fragment>
          <Dragger
            toggleShowDraggerTime={this.toggleShowDraggerTime}
            handleDragDragger={this.handleDragDragger}
            selectDragger={this.selectDragger}
            compareModeActive={this.props.compareModeActive}
            disabled={true}
            draggerName='selectedB'
            draggerPosition={this.state.draggerPositionB}
            draggerVisible={this.state.draggerVisibleB}
            transformX={this.state.currentTransformX}
            // draggerSelected={false}
            parentPosition={this.state.position} />
          <Dragger
            toggleShowDraggerTime={this.toggleShowDraggerTime}
            handleDragDragger={this.handleDragDragger}
            selectDragger={this.selectDragger}
            compareModeActive={this.props.compareModeActive}
            disabled={false}
            draggerName='selected'
            draggerPosition={this.state.draggerPosition}
            draggerVisible={this.state.draggerVisible}
            transformX={this.state.currentTransformX}
            // draggerSelected={true}
            parentPosition={this.state.position} />
        </React.Fragment>
      }
        </svg>
        : null }

        {/* DRAGGER TIME */}
        <div
          className="dateToolTip"
          style={{
            transform: `translate(${this.props.draggerSelected === 'selected' ? this.state.draggerPosition - 5 : this.state.draggerPositionB - 5 }px, -100px)`,
            display: this.state.showDraggerTime && this.state.draggerTimeState ? 'block' : 'none'
        }}>
          {this.state.showDraggerTime && this.state.draggerTimeState ? this.props.draggerSelected === 'selected' ? this.state.draggerTimeState : this.state.draggerTimeStateB : null}
        </div>

        {/* HOVER TIME */}
        <div
          className="dateToolTip"
          style={{
            transform: `translate(${this.state.leftOffset - 52}px, -100px)`,
            display: !this.state.showDraggerTime && this.state.showHoverLine ? 'block' : 'none'
          }}>
            {!this.state.showDraggerTime && this.state.hoverTime ? this.state.hoverTime : null}
          </div>
      </div>
      </React.Fragment>
    );
  }
}

TimelineAxis.defaultProps = {
};
TimelineAxis.propTypes = {
};

export default TimelineAxis;
