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
 * @class DraggerContainer
 * @extends PureComponent
 */
class DraggerContainer extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      draggerWidth: 49,
      draggerTimeState: '',
      draggerTimeStateB: ''
    };
  }

  /**
  * @desc select dragger 'selected' or 'selectedB'
  * @param {String} draggerName
  * @param {Event} click event
  * @returns {void}
  */
  selectDragger = (draggerName, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (draggerName !== this.props.draggerSelected) {
      this.props.onChangeSelectedDragger(draggerName);
    }
  }

  /**
  * @desc move draggerTimeState to inputTime
  * @param {String} inputTime
  * @returns {void}
  */
  setDraggerPosition = (inputTime) => {
    let {
      timeScale,
      position,
      transformX,
      frontDate,
      backDate,
      draggerPosition,
      draggerPositionB,
      draggerSelected,
      draggerTimeState,
      draggerTimeStateB,
      timelineEndDateLimit,
      updateDraggerDatePosition
    } = this.props;

    let isBetween = getIsBetween(inputTime, frontDate, backDate);
    let draggerVisible = false;
    if (isBetween) {
      draggerVisible = true;
    }

    let oldDraggerPosition;
    let newDraggerPosition;
    let newDraggerTime;
    if (draggerSelected === 'selected') {
      oldDraggerPosition = draggerPosition;
      newDraggerTime = draggerTimeState;
    } else {
      oldDraggerPosition = draggerPositionB;
      newDraggerTime = draggerTimeStateB;
    }

    let options = timeScaleOptions[timeScale].timeAxis;
    let gridWidth = options.gridWidth;
    let frontDateObj = moment.utc(frontDate);
    let pixelsToAddToDraggerNew = Math.abs(frontDateObj.diff(inputTime, timeScale, true) * gridWidth);
    newDraggerPosition = pixelsToAddToDraggerNew + position - this.state.draggerWidth + transformX + 2;

    // determine max timelineEndDate position for dragger
    let endDateLimitPositionFromFront = Math.abs(frontDateObj.diff(timelineEndDateLimit, timeScale, true) * gridWidth);
    let endDatePosition = endDateLimitPositionFromFront + position - this.state.draggerWidth + transformX + 2;

    // checks to prevent positioning outside of valid timeline range
    let isBeforeFrontDate = new Date(inputTime) < new Date(frontDate);
    let isAfterBackDate = new Date(inputTime) > new Date(backDate);
    if (newDraggerPosition > endDatePosition || isBeforeFrontDate || isAfterBackDate) {
      newDraggerPosition = oldDraggerPosition;
    }

    this.updateLocalDraggerTimeStates(draggerSelected, newDraggerTime);
    // update parent dragger positioning
    updateDraggerDatePosition(null, draggerSelected, newDraggerPosition, draggerVisible);
  }

  /**
  * @desc handle dragger dragging
  * @param {Event} mouse event
  * @param {Object} draggable delta object
  * @returns {void}
  */
  handleDragDragger = (e, d) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    requestAnimationFrame(() => {
      var deltaX = d.deltaX;
      // if no movement, RETURN out of function
      if (deltaX === 0) {
        return false;
      }
      let {
        timeScale,
        draggerSelected,
        draggerTimeState,
        draggerTimeStateB,
        draggerPosition,
        draggerPositionB,
        frontDate,
        position,
        transformX,
        timelineStartDateLimit,
        timelineEndDateLimit,
        updateDraggerDatePosition
      } = this.props;

      // get timescale specific options for scaleMs and gridWidth
      let options = timeScaleOptions[timeScale].timeAxis;
      let gridWidth = options.gridWidth;

      let draggerTime;
      let newDraggerPosition;
      let newDraggerTime;
      if (draggerSelected === 'selected') { // 'selected is 'A' dragger
        newDraggerPosition = draggerPosition + deltaX;
        draggerTime = draggerTimeState;
      } else { // 'selectedB' is 'B' dragger
        newDraggerPosition = draggerPositionB + deltaX;
        draggerTime = draggerTimeStateB;
      }

      // update draggerTime based on deltaX from state draggerTime
      let draggerTimeValue = new Date(draggerTime).getTime();

      // only need to calculate difference in time unit for varying timescales - month and year
      let diffZeroValues = options.scaleMs;
      if (!diffZeroValues) {
        // calculate based on frontDate due to varying number of days per month and per year (leapyears)
        let draggerPositionRelativeToFrontDate = this.state.draggerWidth - 2 + newDraggerPosition - position - transformX;
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

      // check if new dragger date is within valid date range and format or RETURN out of function
      let isBetweenValidTimeline = getIsBetween(newDraggerTime, timelineStartDateLimit, timelineEndDateLimit);
      if (isBetweenValidTimeline) {
        newDraggerTime = getISODateFormatted(newDraggerTime);
      } else {
        return false;
      }

      this.updateLocalDraggerTimeStates(draggerSelected, newDraggerTime);
      // update parent dragger positioning
      updateDraggerDatePosition(newDraggerTime, draggerSelected, newDraggerPosition, null, null, true);
    });
  }

  // helper dragger time state update
  updateLocalDraggerTimeStates = (draggerSelected, newDraggerTime) => {
    if (draggerSelected === 'selected') {
      this.setState({
        draggerTimeState: newDraggerTime
      });
    } else {
      this.setState({
        draggerTimeStateB: newDraggerTime
      });
    }
  }

  // init locla state time setting
  setInitDraggerTimeStates = () => {
    let {
      draggerTimeState,
      draggerTimeStateB
    } = this.props;
    this.setState({
      draggerTimeState,
      draggerTimeStateB
    });
  }

  componentDidMount() {
    this.setInitDraggerTimeStates();
  }

  componentDidUpdate(prevProps) {
    let {
      dateA,
      dateB,
      draggerTimeState,
      draggerTimeStateB,
      isDraggerDragging,
      draggerSelected,
      isCompareModeActive,
      isAnimationPlaying,
      setDraggerVisibility
    } = this.props;

    // handle dragger visibility update on compare mode activate/deactivate
    if (isCompareModeActive !== prevProps.isCompareModeActive) {
      // turn on compare mode
      if (isCompareModeActive) {
        setDraggerVisibility(true, true);
      } else {
        // turn off compare mode
        if (draggerSelected === 'selected') {
          setDraggerVisibility(true, false);
        } else {
          setDraggerVisibility(false, true);
        }
      }
    }

    if (!isDraggerDragging) {
      // handle A dragger change
      if (draggerTimeState !== prevProps.draggerTimeState &&
          draggerTimeState !== this.state.draggerTimeState) {
        if (!isAnimationPlaying &&
            dateA === draggerTimeState) {
          this.updateLocalDraggerTimeStates('selected', draggerTimeState);
        } else {
          this.setDraggerPosition(draggerTimeState);
        }
      }
      // handle B dragger change
      if (draggerTimeStateB !== prevProps.draggerTimeStateB &&
          draggerTimeStateB !== this.state.draggerTimeStateB) {
        if (!isAnimationPlaying &&
            dateB === draggerTimeStateB) {
          this.updateLocalDraggerTimeStates('selectedB', draggerTimeStateB);
        } else {
          this.setDraggerPosition(draggerTimeStateB);
        }
      }
    }
  }

  render() {
    let {
      draggerSelected,
      toggleShowDraggerTime,
      axisWidth,
      transformX,
      isCompareModeActive,
      draggerPosition,
      draggerPositionB,
      draggerVisible,
      draggerVisibleB
    } = this.props;

    let sharedProps = {
      toggleShowDraggerTime,
      transformX,
      isCompareModeActive,
      handleDragDragger: this.handleDragDragger,
      selectDragger: this.selectDragger
    };
    return (
      draggerSelected === 'selectedB'
        ? <svg className="dragger-container" width={axisWidth} height={83}>
          {isCompareModeActive
            ? <Dragger
              {...sharedProps}
              disabled={true}
              draggerName='selected'
              draggerPosition={draggerPosition}
              draggerVisible={draggerVisible}
            />
            : null}
          <Dragger
            {...sharedProps}
            disabled={false}
            draggerName='selectedB'
            draggerPosition={draggerPositionB}
            draggerVisible={draggerVisibleB}
          />
        </svg>
        : <svg className="dragger-container" width={axisWidth} height={83}>
          {isCompareModeActive
            ? <Dragger
              {...sharedProps}
              disabled={true}
              draggerName='selectedB'
              draggerPosition={draggerPositionB}
              draggerVisible={draggerVisibleB}
            />
            : null}
          <Dragger
            {...sharedProps}
            disabled={false}
            draggerName='selected'
            draggerPosition={draggerPosition}
            draggerVisible={draggerVisible}
          />
        </svg>
    );
  }
}

DraggerContainer.propTypes = {
  axisWidth: PropTypes.number,
  backDate: PropTypes.string,
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
  isAnimationPlaying: PropTypes.bool,
  isCompareModeActive: PropTypes.bool,
  isDraggerDragging: PropTypes.bool,
  onChangeSelectedDragger: PropTypes.func,
  position: PropTypes.number,
  setDraggerVisibility: PropTypes.func,
  timelineEndDateLimit: PropTypes.string,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  toggleShowDraggerTime: PropTypes.func,
  transformX: PropTypes.number,
  updateDraggerDatePosition: PropTypes.func
};

export default DraggerContainer;
