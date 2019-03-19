import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import Deque from 'double-ended-queue';
import moment from 'moment';

import GridRange from './grid-range/grid-range';
import Dragger from './timeline-dragger';

import dateCalc from './date-calc';


const timeScales = [ 'minute', 'hour', 'day', 'month', 'year' ];

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
      scaleMs: null //# null set to require a
      // scaleMs: 2678400000
    }
  },
  'year': {
    timeAxis: {
      scale: 'year',
      gridWidth: 12,
      scaleMs: null
      // scaleMs: 31536000000
    }
  }
};

class TimelineAxis extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // midTileDate: '',
      showDraggerTime: false,
      compareMode: true,
      dragSentinelCount: 0,
      draggerPosition: 0,
      draggerVisible: true,
      draggerSelected: true,
      draggerPositionB: 0,
      draggerVisibleB: true,
      draggerSelectedB: false,
      moved: false,
      timeScaleChange: false,
      deque: null,
      timeScaleSelectValue: 'day',
      increment: 1,
      axisWidth: 800,
      hoverTime: null,
      showHoverLine: false,
      draggerTimeState: null,
      leftOffset: 0,
      selectedDate: this.props.selectedDate, // center of viewport unless restricted by being start/end of available time
      timeScale: 'day',
      endDate: null,
      startDate: null,
      position: -2500,
      currentDateRange: null,
      currentTransformX: 0,
      gridWidth: 100,
      pastDateLimit: '1940-01-01T00:00:00.000',
      futureDateLimit: '2020-01-01T00:00:00.000',
    }
    // this.timelineRef = React.createRef(); //# REF

    // this.showHoverOn = this.showHoverOn.bind(this);
    // this.showHoverOff = this.showHoverOff.bind(this);
  }
  //? how do position and transforms change between scale changes? lock into one line would be ideal
  updateScale = (inputDate, timeScale, axisWidthInput) => {
    let options = timeScaleOptions[timeScale].timeAxis;
    let gridWidth = options.gridWidth;
    let axisWidth = axisWidthInput ? axisWidthInput : this.state.axisWidth;
    let leftOffset = this.state.leftOffset;

    if (leftOffset === 0) {
      leftOffset = axisWidth / 2;
    }

    let numberOfVisibleTiles = Number((axisWidth / gridWidth).toFixed(8));
    let gridNumber = Math.floor(numberOfVisibleTiles * 1.5); // should get from state?
    let dragSentinelChangeNumber = gridWidth * (Math.floor(numberOfVisibleTiles * 0.25) + 1);
    if (timeScale === 'year') {
      gridNumber = 2020 - 1940;
    }

    // Floating point issues need to be handled more cleanly
    let midPoint = -((gridWidth * gridNumber) / 2) + ((numberOfVisibleTiles / 2) * gridWidth);

    // let mockPropsSelectedDate = '1941-01-01';
    // console.log(hoverTime, draggerDateActual, hoverTime)
    let hoverTime = moment.utc(this.state.hoverTime);

    hoverTime = inputDate ? moment.utc(inputDate) : hoverTime;
    console.log(hoverTime.format())
    let hoverTimeZero;
    let hoverTimeNextZero;

    let draggerDateActual = moment.utc(this.state.draggerTimeState);
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
    if (this.state.compareMode) {
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
    // console.log(draggerPosition - pixelsToAdd + position - 49)
    // console.log(draggerPositionB - pixelsToAdd + position - 49)
    this.setState({
      draggerPosition: draggerPosition - pixelsToAdd + position - 49,
      draggerVisible: draggerVisible,
      draggerPositionB: draggerPositionB - pixelsToAdd + position - 49,
      draggerVisibleB: draggerVisibleB,
      deque: deque,
      currentDateRange: current.dates,
      currentTransformX: currentTransformX,
      gridNumber: gridNumber,
      gridWidth: gridWidth,
      numberOfVisibleTiles: numberOfVisibleTiles,
      moved: false,
      timeScaleChange: true,
      dragSentinelChangeNumber: dragSentinelChangeNumber,
      position: position - pixelsToAdd,
      midPoint: position,
      dragSentinelCount: 0
    })
  }

  getDraggerPosition = (draggerTime, frontDate, timeScale, gridWidth) => {
    return Math.abs(moment.utc(frontDate).diff(moment.utc(draggerTime), timeScale, true) * gridWidth);
  }

  // changes timeScale state
  wheelZoom = (e) => {
    // e.preventDefault();
    let arrayIndex = timeScales.indexOf(this.state.timeScale);
    if (e.deltaY > 0) { // wheel zoom out
      if (arrayIndex < 4) {
        let nextGreaterTimeScale = timeScales[arrayIndex + 1];

        //# componentDidUpdate catches this change - BEST WAY TO HANDLE THIS?
        this.setState({
          timeScale: nextGreaterTimeScale
        });
      }
    } else {
      if (arrayIndex > 0) { // wheel zoom in
        let nextSmallerTimeScale = timeScales[arrayIndex - 1];

        //# componentDidUpdate catches this change - BEST WAY TO HANDLE THIS?
        this.setState({
          timeScale: nextSmallerTimeScale
        });
      }
    }
  }

  // get left offset to position blue line on mouseover
  // getLeftOffset = (e, xOffset) => {
  //   e.preventDefault();
  //   // TODO: would like to change this parentOffset dom selector to something more React
  //   //! IE11 DOESN'T LIKE offSetLeft - use getBoundingClientRect() .left
  //   requestAnimationFrame(() => {
  //     let parentOffset = document.querySelector('.inner').parentElement.offsetLeft;
  //     let parentBoundingClientRect = document.querySelector('.inner').parentElement.getBoundingClientRect();
  //     // console.log(parentOffset, parentBoundingClientRect.left)
  //     let x = e.pageX - parentOffset;
  //     let relativeX = x - this.state.position;

  //     let hoverTime = this.showTime(relativeX);
  //     this.setState({
  //       leftOffset: x,
  //       leftOffsetRelativeToInnerParent: relativeX,
  //       hoverTime: hoverTime
  //     });
  //   })
  // }


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
    let timeScale = this.state.timeScale;
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
          }));
        } else {
          // reset dragSentinelCount on direction change to remaining distance to dragSentinelChangeNumber
          let newDragSentinelCount = dragSentinelCount < 0 ? (dragSentinelChangeNumber + dragSentinelCount + deltaX) : dragSentinelCount + deltaX;
          this.setState(() => ({
            draggerPosition: draggerPosition,
            draggerPositionB: draggerPositionB,
            position: position,
            dragSentinelCount: newDragSentinelCount
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
          }));
        } else {
          // reset dragSentinelCount on direction change to remaining distance to dragSentinelChangeNumber
          let newDragSentinelCount = dragSentinelCount > 0 ? (-dragSentinelChangeNumber + dragSentinelCount + deltaX) : dragSentinelCount + deltaX;
          this.setState(() => ({
            draggerPosition: draggerPosition,
            draggerPositionB: draggerPositionB,
            position: position,
            dragSentinelCount: newDragSentinelCount
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
        console.log('NOW VISIBLE', draggerPositionRevision)
      }
      draggerVisible = true;
    } else {
      draggerVisible = false;
    }

    let compareModeOn = this.state.compareMode;
    if (compareModeOn) {
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


  // Called when AXIS dragging starts. If `false` is returned any handler,
  // the action will cancel.
  // handleStartDrag = () => {
    // this.setState({
    //   dragging: !this.state.dragging
    // });
  // }

  // Called when AXIS dragging stops.
  // handleStopDrag = () => {
    // this.setState({
    //   dragging: !this.state.dragging
    // });
  // }

  // set temp place holder for where hover line was when clicked to check for drag vs click
  // setLineClick = () => {
  //   // console.log('hit', this.state.hoverTime)
  //   this.setState({
  //     // draggerTimeState: this.state.hoverTime,
  //     redLineClick: this.state.leftOffset,
  //   })
  // }

  // move red line to new position
  setLineTime = (e) => {

    e.preventDefault();
    e.stopPropagation();
    //TODO: handle stop bubbling up to parent wv-timeline-axis to prevent invoking on clicking draggers
    if (e.target.className.animVal !== 'grid') {
      return
    }
    // console.dir(e.target)
    // console.log(this.state.position , this.state.leftOffset, this.state.redLineClick, this.state.moved, this.state.draggerPosition)
    // if (this.state.leftOffset === this.state.redLineClick) {
    // console.log(!this.state.moved && !this.state.timeScaleChange)
    if (!this.state.moved) {
      console.log('inner')
      // let draggerTimeState = this.showTime(this.state.leftOffsetRelativeToInnerParent);
      // this.handleDragDragger(null, {'deltaX': this.state.leftOffset})
      let draggerPosition = this.state.draggerSelected ? this.state.leftOffset - 49 : this.state.draggerPosition;
      let draggerPositionB = this.state.draggerSelectedB ? this.state.leftOffset - 49 : this.state.draggerPositionB;

      // console.log(this.state.draggerSelected, this.state.draggerSelectedB)
      this.setState({
        draggerPosition: draggerPosition,
        draggerVisible: true,
        draggerPositionB: draggerPositionB,
        // draggerVisible: true,
        draggerTimeState: this.state.hoverTime,
        selectedDate: this.state.hoverTime,
        moved: false
      }, this.props.updateDate(this.state.hoverTime))
    }
  }

  handleResize = (e) => {
    // let axisWidth = Math.floor(window.innerWidth * 0.9);
    let axisWidth = this.props.width;
    let timeScale = this.state.timeScale;
    this.updateScale(null, timeScale, axisWidth);
    console.log('resize')
    this.setState({
      axisWidth: axisWidth
    }, function() {
      let parentBoundingClientRect = document.querySelector('#wv-timeline-axis').getBoundingClientRect();
      this.setState({
        parentBoundingClientRectLeft: parentBoundingClientRect.left
      });
    })
  };

  componentDidMount() {
    //# resize
    window.addEventListener("resize", this.handleResize);
    // let axisWidth = Number((window.innerWidth * 0.9).toFixed(2));
    let axisWidth = this.props.width;
    let timeScale = this.props.timeScale; // 'day'
    let time = moment.utc(this.props.selectedDate).format() //'1941-01-01T12:00:00Z';

    // time = moment.utc(time.toISOString());
    console.log(time)
    // let draggerTimeStateBDraggerBTest = '1941-01-03T12:00:00Z';
    let draggerTimeStateBDraggerBTest = moment.utc(time).add(7, timeScale).format();

    //# get timeScale specifics based on props
    let options = timeScaleOptions[timeScale].timeAxis;
    let gridWidth = options.gridWidth; // 12

    //# calculate number of grids viewable based on axisWidth and gridWidth of timeScale
    // console.log(axisWidth, Math.floor(axisWidth / gridWidth))
    // this.handleResize();
    let numberOfVisibleTiles = Number((axisWidth / gridWidth).toFixed(8));
    // let tilesTillSelectedDAte = Math.floor(numberOfVisibleTiles / 2);
    // let draggerPosition = Number(((axisWidth / 2) - 50).toFixed(8));

    // let draggerPosition = tilesTillSelectedDAte * gridWidth - 49; //# CENTER DRAGGER A
    let draggerVisible = true;

    //# DRAGGER B TESTING POSITION
    // let draggerPositionB = draggerPosition + (gridWidth * 2.5);
    let draggerVisibleB = false;
    let compareModeOn = false;
    if (compareModeOn) {
      draggerVisibleB = true;
    }

    // console.log(numberOfVisibleTiles)
    //# times 1.5 is cutting it close (down to 1 grid at leading edge - will continue to test)
    let gridNumber = Math.floor(numberOfVisibleTiles * 1.5);
    let dragSentinelChangeNumber = gridWidth * (Math.floor(numberOfVisibleTiles * 0.25) + 1);
    // console.log(dragSentinelChangeNumber)
    //# get midPoint for position based on # of tiles and gridWidth
    //# 120 test case - this.getDateArray(60, 60, timeScale, selectedDate);
    // let midPointOLD = -((gridWidth * (numberOfVisibleTiles * 1.5)) / 2) + (numberOfVisibleTiles / 2 * gridWidth);
    // let midPoint = +(-(+((gridWidth * +(numberOfVisibleTiles * 1.5).toFixed(10)) / 2).toFixed(10)) + +(+(numberOfVisibleTiles / 2).toFixed(10) * gridWidth).toFixed(10)).toFixed(10); //# CAN'T FLOOR numberOfVisibleTiles / 2

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

    let pixelsToAdd = diffStartAndZeroed / diffFactor;

    let selectedDate = moment.utc(time);
    // console.log(selectedDate)
    //# handle date array creation
    let current = this.getDateArray(Math.floor(gridNumber/2), Math.floor(gridNumber/2), timeScale, time);

    let frontDate = moment.utc(current.dates[0].rawDate);
    let draggerPosition = Math.abs(frontDate.diff(draggerTime, timeScale, true) * gridWidth);
    let draggerPositionB = Math.abs(frontDate.diff(moment.utc(draggerTimeStateBDraggerBTest), timeScale, true) * gridWidth);
    // this.addLine(initDateStart);
    // console.log(numberOfVisibleTiles, dragSentinelChangeNumber)

    // console.log(draggerPosition, pixelsToAdd, midPoint)
    // console.log(this.getDraggerPosition(draggerTimeStateBDraggerBTest, current.dates[0].rawDate, 'day', gridWidth))

    this.setState({
      compareMode: false,
      timeScaleSelectValue: timeScale,
      deque: new Deque(current.dates),
      // draggerPosition: draggerPosition + pixelsToAdd,
      draggerPosition: draggerPosition + midPoint - 49,
      draggerVisible: draggerVisible,
      draggerPositionB: draggerPositionB + midPoint - 49,
      draggerVisibleB: draggerVisibleB,
      numberOfVisibleTiles: numberOfVisibleTiles,
      dragSentinelChangeNumber: dragSentinelChangeNumber,
      axisWidth: axisWidth,
      timeScale: timeScale,
      selectedDate: time,
      // midTileDate: selectedDate.format(),
      currentDateRange: current.dates,
      gridWidth: gridWidth,
      draggerTimeState: time,
      draggerTimeStateB: draggerTimeStateBDraggerBTest,
      hoverTime: time,
      currentTransformX: 0,
      midPoint: midPoint,
      position: midPoint,
    }, function() {
      // let setPosition = this.getPositionFromDate(selectedDate);
      // console.log(setPosition)
      let parentBoundingClientRect = document.querySelector('#wv-timeline-axis').getBoundingClientRect();
      this.setState({
        parentBoundingClientRectLeft: parentBoundingClientRect.left
      });
    });
  }

  // shouldComponentUpdate(nextProps, nextState) {
    // console.log(nextProps.timeScale, nextState.timeScale, this.state.timeScale)
    // if (this.state.timeScale !== nextState.timeScale) {
    //   console.log('update')
    //   return true;
    // }
    // return false;
    // return true;
  // }

  //# BEST WAY TO HANDLE THIS?
  componentDidUpdate(prevProps, prevState) {

    // console.log(this.props.selectedDate, prevProps.selectedDate)
    // console.log(moment.utc(prevProps.selectedDate).format(), moment.utc(prevState.selectedDate).format())
    // let propsSelectedDate = moment.utc(prevProps.selectedDate).format();
    // let stateSelectedDate = moment.utc(prevState.selectedDate).format();

    // console.log(propsSelectedDate, stateSelectedDate)
    if (this.state.timeScale !== prevState.timeScale) {
      this.updateScale(null, this.state.timeScale);
    }

    if (this.props.width !== prevProps.width) {
      this.handleResize();
    }


    if (this.props.selectedDate !== prevProps.selectedDate) {

      // console.log(this.props.selectedDate, prevProps.selectedDate)
      // console.log('ok', this.props)
      let manualTimeScaleChangeUnit = this.props.timeScaleChangeUnit || this.state.timeScale;

      let options = timeScaleOptions[manualTimeScaleChangeUnit].timeAxis;
      let gridWidth = options.gridWidth;

      let frontDate = moment.utc(this.state.deque.peekFront().rawDate);
      let newSelectedDate = moment.utc(this.props.selectedDate);

      // console.log(newSelectedDate.format(), frontDate.format(), manualTimeScaleChangeUnit, gridWidth)
      // console.log(moment.utc(this.props.selectedDate).format(), moment.utc(prevProps.selectedDate).format())
      let newDraggerPosition = this.getDraggerPosition(newSelectedDate, frontDate, manualTimeScaleChangeUnit, gridWidth)
      console.log(this.state.draggerPosition, newDraggerPosition)


      this.setDraggerToTime(this.props.selectedDate)
      // if (this.props.changeAmt !== null) {
      //   console.log('hit')
      //   if (this.props.changeAmt > 0) {
      //     this.addTimeUnit(manualTimeScaleChangeUnit, this.props.changeAmt)
      //     // this.props.incrementDate(manualTimeScaleChangeUnit, this.props.changeAmt);
      //   } else {
      //     this.minusTimeUnit(manualTimeScaleChangeUnit, -this.props.changeAmt)
      //     // this.props.incrementDate(manualTimeScaleChangeUnit, this.props.changeAmt);
      //   }

      // }
    }
    // else if (propsSelectedDate !== stateSelectedDate) {
    //   this.setState({
    //     selectedDate: propsSelectedDate,
    //     hoverTime: propsSelectedDate,
    //     draggerTimeState: propsSelectedDate
    //   }, this.updateScale(this.state.timeScale))
    // }
  }

    // move red line forward one timeScale unit and update time
    setDraggerToTime = (inputTime) => {
      console.log(inputTime)
      // let timeScaleSelected = manualTimeScaleChangeUnit ? manualTimeScaleChangeUnit : this.state.timeScaleSelectValue;
      let frontDate = moment.utc(this.state.deque.peekFront().rawDate);
      let backDate = moment.utc(this.state.deque.peekBack().rawDate);
      // let increment = manualIncrementAmount ? manualIncrementAmount : this.state.increment;
      let draggerTimeState = moment.utc(this.state.draggerTimeState, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
      let draggerTimeStateAdded = moment.utc(inputTime);

      let isBetween = draggerTimeStateAdded.isBetween(frontDate, backDate, null, '[]');
      let draggerVisible = false;
      let newDraggerPosition;
      if (isBetween) {
        draggerVisible = true;
      }
      let gridWidth = this.state.gridWidth;
      let timeScale = this.state.timeScale;
      let pixelsToAddToDragger = Math.abs(frontDate.diff(draggerTimeState, timeScale, true) * gridWidth);
      let pixelsToAddToDraggerNew = Math.abs(frontDate.diff(draggerTimeStateAdded, timeScale, true) * gridWidth);
      let pixelsToAddBasedOnFrontDate = pixelsToAddToDraggerNew - pixelsToAddToDragger;

      let isVisible = this.state.draggerVisible;
      if (isVisible) {
        newDraggerPosition = this.state.draggerPosition + pixelsToAddBasedOnFrontDate;
      } else {
        newDraggerPosition = pixelsToAddToDraggerNew + this.state.position - 49 + this.state.currentTransformX;
      }

      this.setState({
        draggerPosition: newDraggerPosition,
        draggerVisible: draggerVisible,
        draggerTimeState: draggerTimeStateAdded.format(),
        selectedDate: draggerTimeStateAdded.format(),
      })
      // this.props.incrementDate(timeScaleSelected, increment));
    }

  // TODO: may need to restrict based on zoom levels, year zoom adding 7 minutes does nothing for example
  // move red line forward one timeScale unit and update time
  addTimeUnit = (manualTimeScaleChangeUnit, manualIncrementAmount) => {
    let timeScaleSelected = manualTimeScaleChangeUnit ? manualTimeScaleChangeUnit : this.state.timeScaleSelectValue;
    let frontDate = moment.utc(this.state.deque.peekFront().rawDate);
    let backDate = moment.utc(this.state.deque.peekBack().rawDate);
    let increment = manualIncrementAmount ? manualIncrementAmount : this.state.increment;
    let draggerTimeState = moment.utc(this.state.draggerTimeState, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
    let draggerTimeStateAdded = draggerTimeState.clone().add(increment, timeScaleSelected);

    let isBetween = draggerTimeStateAdded.isBetween(frontDate, backDate, null, '[]');
    let draggerVisible = false;
    let newDraggerPosition;
    if (isBetween) {
      draggerVisible = true;
    }
    let gridWidth = this.state.gridWidth;
    let timeScale = this.state.timeScale;
    let pixelsToAddToDragger = Math.abs(frontDate.diff(draggerTimeState, timeScale, true) * gridWidth);
    let pixelsToAddToDraggerNew = Math.abs(frontDate.diff(draggerTimeStateAdded, timeScale, true) * gridWidth);
    let pixelsToAddBasedOnFrontDate = pixelsToAddToDraggerNew - pixelsToAddToDragger;

    let isVisible = this.state.draggerVisible;
    if (isVisible) {
      newDraggerPosition = this.state.draggerPosition + pixelsToAddBasedOnFrontDate;
    } else {
      newDraggerPosition = pixelsToAddToDraggerNew + this.state.position - 49 + this.state.currentTransformX;
    }

    this.setState({
      draggerPosition: newDraggerPosition,
      draggerVisible: draggerVisible,
      draggerTimeState: draggerTimeStateAdded.format(),
    }, this.props.updateDate(draggerTimeStateAdded.format()))
    // this.props.incrementDate(timeScaleSelected, increment));
  }

  // move red line backward one timeScale unit and update time
  minusTimeUnit = (manualTimeScaleChangeUnit, manualIncrementAmount) => {
    let timeScaleSelected = manualTimeScaleChangeUnit ? manualTimeScaleChangeUnit : this.state.timeScaleSelectValue;
    let frontDate = moment.utc(this.state.deque.peekFront().rawDate);
    let backDate = moment.utc(this.state.deque.peekBack().rawDate);
    let increment = manualIncrementAmount ? manualIncrementAmount : this.state.increment;
    let draggerTimeState = moment.utc(this.state.draggerTimeState, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
    let draggerTimeStateSubtracted = draggerTimeState.clone().subtract(increment, timeScaleSelected);

    let isBetween = draggerTimeStateSubtracted.isBetween(frontDate, backDate, null, '[]');
    let draggerVisible = false;
    let newDraggerPosition;
    if (isBetween) {
      draggerVisible = true;
    }

    let gridWidth = this.state.gridWidth;
    let timeScale = this.state.timeScale;
    let pixelsToAddToDragger = Math.abs(frontDate.diff(draggerTimeState, timeScale, true) * gridWidth);
    let pixelsToAddToDraggerNew = Math.abs(frontDate.diff(draggerTimeStateSubtracted, timeScale, true) * gridWidth);
    let pixelsToAddBasedOnFrontDate = pixelsToAddToDraggerNew - pixelsToAddToDragger;

    let isVisible = this.state.draggerVisible;
    if (isVisible) {
      newDraggerPosition = this.state.draggerPosition + pixelsToAddBasedOnFrontDate;
    } else {
      newDraggerPosition = pixelsToAddToDraggerNew + this.state.position - 49 + this.state.currentTransformX;
    }
    this.setState({
      draggerPosition: newDraggerPosition,
      draggerVisible: draggerVisible,
      draggerTimeState: draggerTimeStateSubtracted.format(),
    }, this.props.updateDate(draggerTimeStateSubtracted.format()))
    // this.props.incrementDate(timeScaleSelected, increment));
  }

  handleStopDrag = (e, d) => {
    let midPoint = this.state.midPoint;
    let position = this.state.position - midPoint;
    let moved = false;
    // necesarry for timescale change, d.x and midPoint are off
    // after timeScale change
    if (d.x > midPoint) { // drag right
      moved = true;
    } else if(d.x < midPoint) { // drag left
      moved = true;
    }
    this.setState({
      moved: moved,
      position: midPoint,
      currentTransformX: this.state.currentTransformX + position,
    })
  }

  displayDate = (date, leftOffset) => {
    requestAnimationFrame(() => {
    //! IE11 undefined parentElement issue fix
      this.setState({
        hoverTime: date,
        leftOffset: leftOffset - this.state.parentBoundingClientRectLeft // relative location from parent bounding box for BLUE LINE
      });
    })
  }

// handle dragger dragging
handleDragDragger = (draggerName, e, d) => {
  // console.log(e,d, draggerName)
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  requestAnimationFrame(() => {
    // var deltaX = d.deltaX || e.movementX; //# NOT THE SAME
    var deltaX = d.deltaX;
    let gridWidth = this.state.gridWidth;
    let timeScale = this.state.timeScale;
    let axisWidth = this.state.axisWidth;
    let dragSentinelChangeNumber = this.state.dragSentinelChangeNumber;
    let dragSentinelCount = this.state.dragSentinelCount;

    let time;
    let draggerPosition;
    if (draggerName === 'A') {
      draggerPosition = this.state.draggerPosition + deltaX;
      time = this.state.draggerTimeState;
    } else { // draggerName === 'B'
      draggerPosition = this.state.draggerPositionB + deltaX;
      time = this.state.redLineTimeB;
    }

    // console.log(draggerPosition, time)
    // update redLineTime based on deltaX from state redLineTime
    // TODO: test consistency throught timescales, currently seems off 0.5 on ocassion
    let draggerTime = moment.utc(time);
    let draggerTimeZero = draggerTime.clone().startOf(timeScale);
    let draggerTimeNextZero = draggerTimeZero.clone().add(1, timeScale);

    let draggerTimeValue = draggerTime.valueOf();
    let draggerTimeZeroValue = draggerTimeZero.valueOf();
    let draggerTimeNextZeroValue = draggerTimeNextZero.valueOf();

    let diffZeroValues = draggerTimeNextZeroValue - draggerTimeZeroValue;
    let diffFactor = diffZeroValues / gridWidth;
    let newDraggerTime = moment.utc(draggerTimeValue + (diffFactor * deltaX)).format();

    // handle drag timeline
    // TODO: updatePanel
    if (draggerPosition < -49) { // handle drag timeline towards PAST
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
    } else if (draggerPosition > axisWidth - 49) { // handle drag timeline towards FUTURE
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
      if (draggerName === 'A') {
        console.log(newDraggerTime)
        this.setState({
          draggerPosition: draggerPosition,
          redLineTime: newDraggerTime,
          draggerTimeState: newDraggerTime,
          moved: true,
          draggerSelected: true,
          draggerSelectedB: false,
        }, this.props.updateDate(newDraggerTime));
      } else {
        this.setState({
          draggerPositionB: draggerPosition,
          redLineTimeB: newDraggerTime,
          moved: true,
          draggerSelected: false,
          draggerSelectedB: true,
        });
      }
    }
  })
}

  // select dragger
  selectDragger = (draggerName) => {
    this.setState((prev) => ({
      draggerSelected: draggerName === 'A' ? true : false,
      draggerSelectedB: draggerName === 'B' ? true : false
    })
    )
  }

  //# HANDLE INCREMENT FORM TESTING
  handleChangeZoomLevel(event) {
    event.preventDefault();
    this.setState({
      timeScale: event.target.value,
      leftOffset: this.state.axisWidth/2
    });
  }

 handleChange(event) {
    this.setState({ increment: Number(event.target.value) });
  }

  handleSubmit(event) {
    event.preventDefault();
  }

  handleReset(event) {
    this.setState({ increment: 1 });
  }

  handleTimeScaleSelectChange(event) {
    this.setState({ timeScaleSelectValue: event.target.value })
  }

  showHoverOn = () => {
    if (!this.state.showDraggerTime) {
      this.setState({ showHoverLine: true });
    }
  }

  showHoverOff = () => {
    this.setState({ showHoverLine: false });
  }

  toggleCompareMode = () => {
    let frontDate = moment.utc(this.state.deque.peekFront().rawDate);
    let backDate = moment.utc(this.state.deque.peekBack().rawDate);
    let draggerTimeStateB = moment.utc(this.state.draggerTimeStateB, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
    let isBetween = draggerTimeStateB.isBetween(frontDate, backDate, null, '[]');

    let draggerVisibleB = isBetween ? true : false;
    this.setState({
      compareMode: !this.state.compareMode,
      draggerVisibleB: draggerVisibleB
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
    return (
      <div>
        <div style={{display: 'flex', position: 'relative', left: (window.innerWidth * 0.05)}}>
          <div style={{display: 'flex', background: '#999', border: '1px solid black', width: '155px', height: '100px'}}>
            <form onSubmit={this.handleSubmit.bind(this)}>
              <label>
                <input type="text" value={this.state.increment} onChange={(e) => this.handleChange(e)} />
              </label>
              <select value={this.state.timeScaleSelectValue} onChange={(e) => this.handleTimeScaleSelectChange(e)}>
                <option value="minute">minute</option>
                <option value="hour">hour</option>
                <option value="day">day</option>
                <option value="month">month</option>
                <option value="year">year</option>
              </select>
              <button >Set</button>
              <button onClick={() => this.handleReset()}>Reset</button>

            </form>
            <button className="incrementButton" onClick={() => this.minusTimeUnit()}>{"<"}</button>
            <button className="incrementButton" onClick={() => this.addTimeUnit()}>{">"}</button>
          </div>
          <div className="changeZoomLevelButtons" style={{display: 'flex', border: '1px solid black'}}>
            <button value="minute" onClick={(e) => this.handleChangeZoomLevel(e)}>minute</button>
            <button value="hour" onClick={(e) => this.handleChangeZoomLevel(e)}>hour</button>
            <button value="day" onClick={(e) => this.handleChangeZoomLevel(e)}>day</button>
            <button value="month" onClick={(e) => this.handleChangeZoomLevel(e)}>month</button>
            <button value="year" onClick={(e) => this.handleChangeZoomLevel(e)}>year</button>
          </div>
          <div>
            <button onClick={(e) => this.toggleCompareMode(e)}>Compare Mode</button>
          </div>
        </div>
      <div id="wv-timeline-axis"
        // ref={this.timelineRef} //# REF
        style={{width: `${this.state.axisWidth}px`}}
        // onMouseMove={(e) => this.getLeftOffset(e, e.clientX)}
        // onMouseDown={() => this.setLineClick()}
        onMouseUp={(e) => this.setLineTime(e)}
        onWheel={(e) => this.wheelZoom(e)}
        // onMouseOver={() => this.setState({showHoverLine: true})}
        // onMouseLeave={() => this.setState({showHoverLine: false})}
        onMouseOver={this.showHoverOn}
        onMouseLeave={this.showHoverOff}
      >
      {this.state.currentDateRange ?
      <svg className="inner"
        width={this.state.axisWidth}
        height={70}
        viewBox={`0 0 ${this.state.axisWidth} 75`}
        preserveAspectRatio="none">
        {/* <clipPath id="myClip">
          <rect width="884" height="90" x={-this.state.position}/>
        </clipPath> */}
        <defs>
          <clipPath id="textDisplay">
            <rect width="200" height="70" />
          </clipPath>
        </defs>
        <Draggable
          axis="x"
          onDrag={this.handleDrag.bind(this)}
          position={{ x: this.state.position, y: 0 }}
          // onStart={this.handleStartDrag.bind(this)}
          onStop={this.handleStopDrag.bind(this)}

        >
        {/* <g clipPath="url(#myClip)"> */}
        <g>
          <GridRange
          showHoverLine={this.state.showHoverLine}
            timeScale={this.state.timeScale}
            displayDate={this.displayDate}
            gridWidth={this.state.gridWidth}
            dateArray={this.state.currentDateRange}
            transformX={this.state.currentTransformX} />
        </g>
        </Draggable>
        <Dragger
          toggleShowDraggerTime={this.toggleShowDraggerTime}
          handleDragDragger={this.handleDragDragger}
          selectDragger={this.selectDragger}
          compareOn={this.state.compareMode}
          draggerName='A'
          draggerPosition={this.state.draggerPosition}
          draggerVisible={this.state.draggerVisible}
          transformX={this.state.currentTransformX}
          draggerSelected={this.state.draggerSelected}
          parentPosition={this.state.position} />
        <Dragger
          toggleShowDraggerTime={this.toggleShowDraggerTime}
          handleDragDragger={this.handleDragDragger}
          selectDragger={this.selectDragger}
          compareOn={this.state.compareMode}
          draggerName='B'
          draggerPosition={this.state.draggerPositionB}
          draggerVisible={this.state.compareMode ? this.state.draggerVisibleB : false}
          transformX={this.state.currentTransformX}
          draggerSelected={this.state.draggerSelectedB}
          parentPosition={this.state.position} />
        </svg>
        : null }
        {/* <div className="line" style={{transform: `translate(${this.state.leftOffset}px, 0px)`, display: this.state.showHoverLine ? 'block' : 'none'}}></div> */}
        <div className="dateToolTip" style={{transform: `translate(${this.state.draggerPosition - 5}px, -100px)`, display: this.state.showDraggerTime && this.state.redLineTime ? 'block' : 'none'}}>{this.state.showDraggerTime && this.state.redLineTime ? this.state.redLineTime : null}</div>
        <div className="dateToolTip" style={{transform: `translate(${this.state.leftOffset - 52}px, -100px)`, display: !this.state.showDraggerTime && this.state.showHoverLine ? 'block' : 'none'}}>{!this.state.showDraggerTime && this.state.hoverTime ? this.state.hoverTime : null}</div>

      </div>
      <div style={{ display: 'flex', marginTop: 10 }}>
          <div className="dateTempHolderTextBlock" style={{borderColor: 'blue'}}>
            <h4 style={{marginTop: 5, marginBottom: 5}}>HOVER TIME</h4>
            <p style={{marginTop: 5, marginBottom: 0, fontSize: 20}}>{this.state.hoverTime ? this.state.hoverTime : null}</p>
          </div>
          <div className="dateTempHolderTextBlock" style={{borderColor: 'red'}}>
            <h4 style={{marginTop: 5, marginBottom: 5}}>DRAGGER A TIME</h4>
            <p style={{marginTop: 5, marginBottom: 0, fontSize: 20}}>{this.state.draggerTimeState ? this.state.draggerTimeState : null}</p>
          </div>
          <div className="dateTempHolderTextBlock" style={{borderColor: 'orange'}}>
            <h4 style={{marginTop: 5, marginBottom: 5}}>DRAGGER B TIME</h4>
            <p style={{marginTop: 5, marginBottom: 0, fontSize: 20}}>{this.state.draggerTimeStateB ? this.state.draggerTimeStateB : null}</p>
          </div>
          <div className="dateTempHolderTextBlock" style={{borderColor: 'black'}}>
            <h4 style={{marginTop: 5, marginBottom: 5}}>TIMESCALE ZOOM</h4>
            <p style={{marginTop: 5, marginBottom: 0, fontSize: 20}}>{this.state.timeScale ? this.state.timeScale.toUpperCase() : null}</p>
          </div>
        </div>
      </div>
    );
  }
}

TimelineAxis.defaultProps = {
};
TimelineAxis.propTypes = {
};

export default TimelineAxis;
