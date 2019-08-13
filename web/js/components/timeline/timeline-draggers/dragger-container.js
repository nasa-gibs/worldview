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
      draggerWidth: 49
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
  * @param {Boolean} isDraggerB
  * @returns {void}
  */
  setDraggerPosition = (inputTime, isDraggerB) => {
    const {
      timeScale,
      position,
      transformX,
      frontDate,
      backDate,
      draggerPosition,
      draggerPositionB,
      timelineEndDateLimit,
      updateDraggerDatePosition
    } = this.props;

    const isBetween = getIsBetween(inputTime, frontDate, backDate);
    let draggerVisible = false;
    if (isBetween) {
      draggerVisible = true;
    }

    let oldDraggerPosition;
    let newDraggerPosition;
    let draggerSelected;
    if (isDraggerB) {
      oldDraggerPosition = draggerPositionB;
      draggerSelected = 'selectedB';
    } else {
      oldDraggerPosition = draggerPosition;
      draggerSelected = 'selected';
    }

    const options = timeScaleOptions[timeScale].timeAxis;
    const gridWidth = options.gridWidth;
    const frontDateObj = moment.utc(frontDate);
    const pixelsToAddToDraggerNew = Math.abs(frontDateObj.diff(inputTime, timeScale, true) * gridWidth);
    newDraggerPosition = pixelsToAddToDraggerNew + position - this.state.draggerWidth + transformX + 2;

    // determine max timelineEndDate position for dragger
    const endDateLimitPositionFromFront = Math.abs(frontDateObj.diff(timelineEndDateLimit, timeScale, true) * gridWidth);
    const endDatePosition = endDateLimitPositionFromFront + position - this.state.draggerWidth + transformX + 2;

    // checks to prevent positioning outside of valid timeline range
    const isBeforeFrontDate = new Date(inputTime) < new Date(frontDate);
    const isAfterBackDate = new Date(inputTime) > new Date(backDate);
    if (newDraggerPosition > endDatePosition || isBeforeFrontDate || isAfterBackDate) {
      newDraggerPosition = oldDraggerPosition;
    }

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
      const {
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
      const options = timeScaleOptions[timeScale].timeAxis;
      const gridWidth = options.gridWidth;

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

      // update draggerTime based on deltaX draggerTime
      const draggerTimeValue = new Date(draggerTime).getTime();

      // only need to calculate difference in time unit for varying timescales - month and year
      const diffZeroValues = options.scaleMs;
      if (!diffZeroValues) {
        // calculate based on frontDate due to varying number of days per month and per year (leapyears)
        const draggerPositionRelativeToFrontDate = this.state.draggerWidth - 2 + newDraggerPosition - position - transformX;
        const gridWidthCoef = draggerPositionRelativeToFrontDate / gridWidth;
        const draggerDateAdded = moment.utc(frontDate).add((Math.floor(gridWidthCoef)), timeScale);

        let daysCount;
        if (timeScale === 'year') {
          daysCount = draggerDateAdded.isLeapYear() ? 366 : 365;
        } else if (timeScale === 'month') {
          daysCount = draggerDateAdded.daysInMonth();
        }
        const gridWidthCoefRemainder = gridWidthCoef - Math.floor(gridWidthCoef);
        const remainderMilliseconds = daysCount * 86400000 * gridWidthCoefRemainder;
        newDraggerTime = draggerDateAdded.add(remainderMilliseconds);
      } else {
        const diffFactor = diffZeroValues / gridWidth;
        newDraggerTime = draggerTimeValue + (diffFactor * deltaX);
      }

      // check if new dragger date is within valid date range and format or RETURN out of function
      const isBetweenValidTimeline = getIsBetween(newDraggerTime, timelineStartDateLimit, timelineEndDateLimit);
      if (isBetweenValidTimeline) {
        newDraggerTime = getISODateFormatted(newDraggerTime);
      } else {
        return false;
      }

      // update parent dragger positioning
      updateDraggerDatePosition(newDraggerTime, draggerSelected, newDraggerPosition, null, null, true);
    });
  }

  componentDidUpdate(prevProps) {
    const {
      draggerTimeState,
      draggerTimeStateB,
      isDraggerDragging,
      draggerSelected,
      isCompareModeActive,
      setDraggerVisibility
    } = this.props;

    // handle dragger visibility update on compare mode activate/deactivate
    const hasCompareModeChanged = isCompareModeActive !== prevProps.isCompareModeActive;
    if (hasCompareModeChanged) {
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
      const propsTimeStateChanged = draggerTimeState !== prevProps.draggerTimeState;
      if (propsTimeStateChanged && (isCompareModeActive || draggerSelected === 'selected')) {
        this.setDraggerPosition(draggerTimeState, false);
      }
      // handle B dragger change
      const propsTimeStateBChanged = draggerTimeStateB !== prevProps.draggerTimeStateB;
      if (propsTimeStateBChanged && (isCompareModeActive || draggerSelected === 'selectedB')) {
        this.setDraggerPosition(draggerTimeStateB, true);
      }
    }
  }

  render() {
    const {
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

    const sharedProps = {
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
