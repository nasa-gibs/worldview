import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Dragger from './timeline-dragger';

import moment from 'moment';

import { getISODateFormatted, getIsBetween } from '../date-util';
import { timeScaleOptions } from '../../../modules/date/constants';

/*
 * Dragger container used to conditionally render based on selected dragger
 * this is necessary for svg dragger z-index (ex: allow B to drag over A if B being dragged)
 *
 * @class Dragger
 * @extends PureComponent
 */
class DraggerContainer extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      draggerWidth: 49
    };
  }

  // select dragger 'selected' or 'selectedB'
  selectDragger = (draggerName, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (draggerName !== this.props.draggerSelected) {
      this.props.onChangeSelectedDragger(draggerName);
    }
  }

  // move draggerTimeState to inputTime
  setDraggerPosition = (inputTime) => {
    let frontDate = this.props.frontDate;
    let backDate = this.props.backDate;
    let draggerB = this.props.draggerSelected === 'selectedB';
    let draggerName = draggerB ? 'selectedB' : 'selected';

    let isBetween = getIsBetween(inputTime, frontDate, backDate);

    let draggerVisible = false;
    let newDraggerPosition;
    if (isBetween) {
      draggerVisible = true;
    }

    let timeScale = this.props.timeScale;
    let options = timeScaleOptions[timeScale].timeAxis;
    let gridWidth = options.gridWidth;
    let frontDateObj = moment.utc(frontDate);
    let pixelsToAddToDraggerNew = Math.abs(frontDateObj.diff(inputTime, timeScale, true) * gridWidth);
    newDraggerPosition = pixelsToAddToDraggerNew + this.props.position - this.state.draggerWidth + this.props.transformX + 2;
    this.props.updateDraggerDatePosition(null, draggerName, newDraggerPosition, draggerVisible);
  }

  // handle dragger dragging
  handleDragDragger = (draggerName, e, d) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // requestAnimationFrame(() => {
      var deltaX = d.deltaX;
      if (deltaX === 0) {
        return false;
      }
      let timeScale = this.props.timeScale;

      let options = timeScaleOptions[timeScale].timeAxis;
      let gridWidth = options.gridWidth;

      // let axisWidth = this.props.axisWidth;
      // let dragSentinelChangeNumber = this.state.dragSentinelChangeNumber;
      // let dragSentinelCount = this.state.dragSentinelCount;

      let time;
      let draggerPosition;
      let draggerASelected = draggerName === 'selected';
      if (draggerASelected) { // 'selected is 'A' dragger
        draggerPosition = this.props.draggerPosition + deltaX;
        time = this.props.draggerTimeState;
      } else { // 'selectedB' is 'B' dragger
        draggerPosition = this.props.draggerPositionB + deltaX;
        time = this.props.draggerTimeStateB;
      }

      // update draggerTime based on deltaX from state draggerTime
      let draggerTimeValue = new Date(time).getTime();

      // only need to calculate difference in time unit for varying timescales - month and year
      let newDraggerTime;
      let diffZeroValues = options.scaleMs;
      if (!diffZeroValues) {
        // calculate based on frontDate due to varying number of days per month and per year (leapyears)
        let frontDate = this.props.frontDate;
        // ! -2 necessary from subtracting 2 from transformX in updateScale ?
        // let draggerPositionRelativeToFrontDate = this.state.draggerWidth - 2 + draggerPosition - this.state.position - this.state.transformX;
        let draggerPositionRelativeToFrontDate = this.state.draggerWidth - 2 + draggerPosition - this.props.position - this.props.transformX;
        let gridWidthCoef = draggerPositionRelativeToFrontDate / gridWidth;
        let draggerDateAdded = moment.utc(frontDate).add((Math.floor(gridWidthCoef)), timeScale);

        let daysCount;
        if (timeScale === 'year') {
          daysCount = draggerDateAdded.isLeapYear() ? 366 : 365;
        } else if (timeScale === 'month') {
          daysCount = draggerDateAdded.daysInMonth();
        }
        let gridWidthCoefRemainder = gridWidthCoef - Math.floor(gridWidthCoef);
        let remainderMilliseconds = daysCount * 86400000 * gridWidthCoefRemainder;
        newDraggerTime = draggerDateAdded.add(remainderMilliseconds);
      } else {
        let diffFactor = diffZeroValues / gridWidth;
        newDraggerTime = draggerTimeValue + (diffFactor * deltaX);
      }

      // check if new dragger date is within valid date range
      let isBetweenValidTimeline = getIsBetween(newDraggerTime, this.props.timelineStartDateLimit, this.props.timelineEndDateLimit);
      if (isBetweenValidTimeline) {
        newDraggerTime = getISODateFormatted(newDraggerTime);
      } else {
        return false;
      }

      // handle drag timeline
      // // TODO: fix drag off current view - doesn't drag/update date of hover properly
      // if (draggerPosition < -draggerWidth) { // # handle drag timeline towards PAST
      //   // console.log('drag off view past', deltaX, (dragSentinelCount + deltaX), -dragSentinelChangeNumber)
      //   let position = this.state.position - deltaX;

      //   if ((dragSentinelCount + deltaX) < -dragSentinelChangeNumber) {
      //     // console.log('drag off view past UNSHIFT TILES')
      //     let overDrag = 0;
      //     if ((dragSentinelCount + deltaX) < -dragSentinelChangeNumber - dragSentinelChangeNumber) {
      //       overDrag = Math.abs((dragSentinelCount + deltaX) - -dragSentinelChangeNumber - -dragSentinelChangeNumber);
      //     }
      //     //# NEED TO PASS NEGATIVE OF DELTAX FOR UPDATE PANEL
      //     let { currentTimeRange,
      //                     deque,
      //         transformX,
      //           draggerVisible,
      //           draggerVisibleB,
      //             overDragGrids,
      //         draggerPositionRevision } = this.updatePanelDateRange(position, timeScale, -deltaX, draggerPosition, overDrag);

      //     this.setState({
      //       currentTimeRange: currentTimeRange,
      //       deque: deque,
      //       transformX: transformX,
      //       draggerPosition: -48,
      //       moved: true,
      //       position: position,
      //       dragSentinelCount: (dragSentinelCount + deltaX) - -dragSentinelChangeNumber + (overDragGrids * gridWidth),
      //     })
      //   } else {
      //     let newDragSentinelCount = dragSentinelCount > 0 ? (-dragSentinelChangeNumber + dragSentinelCount + deltaX) : dragSentinelCount + deltaX;

      //     // NEGATIVE DELTAX
      //     this.setState({
      //       draggerPosition: -48,
      //       moved: true,
      //       position: position,
      //       dragSentinelCount: newDragSentinelCount
      //     })
      //   }
      // } else if (draggerPosition > axisWidth - draggerWidth) { // handle drag timeline towards FUTURE
      //   // console.log('drag off view future', deltaX)
      //   let position = this.state.position - deltaX;

      //   if ((dragSentinelCount + deltaX) > dragSentinelChangeNumber) {

      //     let overDrag = 0;
      //     if ((dragSentinelCount + deltaX) > dragSentinelChangeNumber + dragSentinelChangeNumber) {
      //       overDrag = Math.abs((dragSentinelCount + deltaX) - dragSentinelChangeNumber - dragSentinelChangeNumber);
      //     }
      //     //# NEED TO PASS NEGATIVE OF DELTAX FOR UPDATE PANEL
      //     let { currentTimeRange,
      //                       deque,
      //           transformX,
      //             draggerVisible,
      //             draggerVisibleB,
      //               overDragGrids,
      //     draggerPositionRevision } = this.updatePanelDateRange(position, timeScale, -deltaX, draggerPosition, overDrag);

      //     this.setState({
      //       currentTimeRange: currentTimeRange,
      //       deque: deque,
      //       transformX: transformX,
      //       draggerPosition: axisWidth - 50,
      //       moved: true,
      //       position: position,
      //       dragSentinelCount: (dragSentinelCount + deltaX) - dragSentinelChangeNumber - (overDragGrids * gridWidth),
      //     })

      //   } else {
      //     let newDragSentinelCount = dragSentinelCount < 0 ? (dragSentinelChangeNumber + dragSentinelCount + deltaX) : dragSentinelCount + deltaX;

      //     // POSITIVE DELTAX
      //     this.setState({
      //       draggerPosition: axisWidth - 50,
      //       moved: true,
      //       position: position,
      //       dragSentinelCount: newDragSentinelCount
      //     })
      //   }
      // } else { // handle drag within axis view

    this.props.updateDraggerDatePosition(newDraggerTime, draggerName, draggerPosition, null, null, true);
  }

  componentDidUpdate(prevProps, prevState) {
    let { draggerTimeState, draggerTimeStateB, timeScale } = this.props;
    let { isDraggerDragging } = this.props;
    let { dateA, dateB, draggerSelected, compareModeActive } = this.props;

    // handle dragger visibility update on compare mode activate/deactivate
    if (compareModeActive !== prevProps.compareModeActive) {
      // TURN ON COMPARE MODE
      if (compareModeActive) {
        this.props.setDraggerVisibility(true, true);
      } else {
        // TURN OFF COMPARE MODE
        if (draggerSelected === 'selected') {
          this.props.setDraggerVisibility(true, false);
        } else {
          this.props.setDraggerVisibility(false, true);
        }
      }
    }

    if (!isDraggerDragging) {
      // handle A dragger change
      if (draggerTimeState !== prevProps.draggerTimeState) {
        // this.setDraggerPosition(prevProps.draggerTimeState, draggerTimeState)
        this.setDraggerPosition(draggerTimeState)
      }
      // handle B dragger change
      if (draggerTimeStateB !== prevProps.draggerTimeStateB) {
        // this.setDraggerPosition(prevProps.draggerTimeStateB, draggerTimeStateB)
        this.setDraggerPosition(draggerTimeStateB)
      }
    }
  }

  // shouldComponentUpdate(nextProps) {
  //   let {
  //     draggerTimeState,
  //     draggerTimeStateB,
  //     dateA,
  //     dateB,
  //     draggerSelected,
  //     width,
  //     transformX,
  //     compareModeActive,
  //     draggerPosition,
  //     draggerPositionB,
  //     draggerVisible,
  //     draggerVisibleB
  //   } = this.props;

  //   let checkForPropsUpdates = (
  //     nextProps.draggerTimeState === draggerTimeState &&
  //     nextProps.draggerTimeStateB === draggerTimeStateB &&
  //     nextProps.dateA === dateA &&
  //     nextProps.dateB === dateB &&
  //     nextProps.draggerSelected === draggerSelected &&
  //     nextProps.width === width &&
  //     nextProps.transformX === transformX &&
  //     nextProps.compareModeActive === compareModeActive &&
  //     nextProps.draggerPosition === draggerPosition &&
  //     nextProps.draggerPositionB === draggerPositionB &&
  //     nextProps.draggerVisible === draggerVisible &&
  //     nextProps.draggerVisibleB === draggerVisibleB
  //   );

  //   if (checkForPropsUpdates) {
  //     return false;
  //   }
  //   return true;
  // }

  render() {
    let {
      draggerSelected,
      toggleShowDraggerTime,
      width,
      transformX,
      compareModeActive,
      draggerPosition,
      draggerPositionB,
      draggerVisible,
      draggerVisibleB
    } = this.props;

    let sharedProps = {
      toggleShowDraggerTime,
      transformX,
      compareModeActive
    };
    return (
      draggerSelected === 'selectedB'
        ? <svg className="dragger-container" width={width}>
          {compareModeActive
            ? <Dragger
              {...sharedProps}
              disabled={true}
              draggerName='selected'
              draggerPosition={draggerPosition}
              draggerVisible={draggerVisible}
              handleDragDragger={this.handleDragDragger}
              selectDragger={this.selectDragger}
              toggleShowDraggerTime={toggleShowDraggerTime}
            />
            : null}
          <Dragger
            {...sharedProps}
            disabled={false}
            draggerName='selectedB'
            draggerPosition={draggerPositionB}
            draggerVisible={draggerVisibleB}
            handleDragDragger={this.handleDragDragger}
            selectDragger={this.selectDragger}
            toggleShowDraggerTime={toggleShowDraggerTime}
          />
        </svg>
        : <svg className="dragger-container" width={width}>
          {compareModeActive
            ? <Dragger
              {...sharedProps}
              disabled={true}
              draggerName='selectedB'
              draggerPosition={draggerPositionB}
              draggerVisible={draggerVisibleB}
              handleDragDragger={this.handleDragDragger}
              selectDragger={this.selectDragger}
              toggleShowDraggerTime={toggleShowDraggerTime}
            />
            : null}
          <Dragger
            {...sharedProps}
            disabled={false}
            draggerName='selected'
            draggerPosition={draggerPosition}
            draggerVisible={draggerVisible}
            handleDragDragger={this.handleDragDragger}
            selectDragger={this.selectDragger}
            toggleShowDraggerTime={toggleShowDraggerTime}
          />
        </svg>
    );
  }
}

DraggerContainer.propTypes = {
  compareModeActive: PropTypes.bool,
  disabled: PropTypes.bool,
  draggerName: PropTypes.string,
  draggerPosition: PropTypes.number,
  draggerVisible: PropTypes.bool,
  handleDragDragger: PropTypes.func,
  selectDragger: PropTypes.func,
  toggleShowDraggerTime: PropTypes.func,
  transformX: PropTypes.number
};

export default DraggerContainer;
