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
      draggerSelected
    } = this.props;

    let isBetween = getIsBetween(inputTime, frontDate, backDate);

    let draggerVisible = false;
    let newDraggerPosition;
    if (isBetween) {
      draggerVisible = true;
    }

    let options = timeScaleOptions[timeScale].timeAxis;
    let gridWidth = options.gridWidth;
    let frontDateObj = moment.utc(frontDate);
    let pixelsToAddToDraggerNew = Math.abs(frontDateObj.diff(inputTime, timeScale, true) * gridWidth);
    newDraggerPosition = pixelsToAddToDraggerNew + position - this.state.draggerWidth + transformX + 2;

    if (draggerSelected === 'selected') {
      this.setState({
        draggerTimeState: this.props.draggerTimeState
      });
    } else {
      this.setState({
        draggerTimeStateB: this.props.draggerTimeStateB
      });
    }

    this.props.updateDraggerDatePosition(null, draggerSelected, newDraggerPosition, draggerVisible);
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
        timelineEndDateLimit
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

      if (draggerSelected === 'selected') {
        this.setState({
          draggerTimeState: newDraggerTime
        });
      } else {
        this.setState({
          draggerTimeStateB: newDraggerTime
        });
      }
      this.props.updateDraggerDatePosition(newDraggerTime, draggerSelected, newDraggerPosition, null, null, true);
    });
  }

  componentDidMount() {
    this.setState({
      draggerTimeState: this.props.draggerTimeState,
      draggerTimeStateB: this.props.draggerTimeStateB
    });
  }

  componentDidUpdate(prevProps, prevState) {
    let {
      draggerTimeState,
      draggerTimeStateB,
      isDraggerDragging,
      draggerSelected,
      compareModeActive
    } = this.props;

    // handle dragger visibility update on compare mode activate/deactivate
    if (compareModeActive !== prevProps.compareModeActive) {
      // turn on compare mode
      if (compareModeActive) {
        this.props.setDraggerVisibility(true, true);
      } else {
        // turn off compare mode
        if (draggerSelected === 'selected') {
          this.props.setDraggerVisibility(true, false);
        } else {
          this.props.setDraggerVisibility(false, true);
        }
      }
    }

    if (!isDraggerDragging) {
      // handle A dragger change
      if (draggerTimeState !== prevProps.draggerTimeState && draggerTimeState !== this.state.draggerTimeState) {
        this.setDraggerPosition(draggerTimeState);
      }
      // handle B dragger change
      if (draggerTimeStateB !== prevProps.draggerTimeStateB && draggerTimeStateB !== this.state.draggerTimeStateB) {
        this.setDraggerPosition(draggerTimeStateB);
      }
    }
  }

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
      compareModeActive,
      handleDragDragger: this.handleDragDragger,
      selectDragger: this.selectDragger
    };
    return (
      draggerSelected === 'selectedB'
        ? <svg className="dragger-container" width={width} height={83}>
          {compareModeActive
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
        : <svg className="dragger-container" width={width} height={83}>
          {compareModeActive
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
