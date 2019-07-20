import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import util from '../../util/util';

import ErrorBoundary from '../../containers/error-boundary';
import MobileDatePicker from '../../components/timeline/mobile-date-picker';

import TimelineAxis from '../../components/timeline/timeline-axis/timeline-axis';
import TimeScaleIntervalChange from '../../components/timeline/timeline-controls/interval-timescale-change';
import DraggerContainer from '../../components/timeline/timeline-draggers/dragger-container';
import AxisHoverLine from '../../components/timeline/timeline-axis/date-tooltip/axis-hover-line';
import DateToolTip from '../../components/timeline/timeline-axis/date-tooltip/date-tooltip';
import CustomIntervalSelectorWidget from '../../components/timeline/custom-interval-selector/interval-selector-widget';

import DateSelector from '../../components/date-selector/date-selector';
import DateChangeArrows from '../../components/timeline/timeline-controls/date-change-arrows';

import AnimationButton from '../../components/timeline/timeline-controls/animation-button';
import AxisTimeScaleChange from '../../components/timeline/timeline-controls/axis-timescale-change';
import TimelineRangeSelector from '../../components/range-selection/range-selection';

import {
  debounce as lodashDebounce,
  throttle as lodashThrottle,
  get as lodashGet
} from 'lodash';
import {
  getIsBetween,
  getISODateFormatted
} from '../../components/timeline/date-util';
import {
  hasSubDaily,
  lastDate as layersLastDateTime
} from '../../modules/layers/selectors';
import {
  selectDate,
  changeTimeScale,
  selectInterval,
  changeCustomInterval,
  updateAppNow
} from '../../modules/date/actions';
import { toggleActiveCompareState } from '../../modules/compare/actions';
import {
  onActivate as openAnimation,
  onClose as closeAnimation,
  changeStartAndEndDate,
  changeStartDate,
  changeEndDate
} from '../../modules/animation/actions';
import {
  timeScaleFromNumberKey,
  timeScaleToNumberKey,
  timeScaleOptions
} from '../../modules/date/constants';

const ANIMATION_DELAY = 500;

class Timeline extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      position: 0,
      transformX: 0,
      leftOffset: 0,
      frontDate: '',
      backDate: '',
      animationStartLocationDate: '',
      animationEndLocationDate: '',
      animationStartLocation: 0,
      animationEndLocation: 0,
      draggerTimeState: '',
      draggerTimeStateB: '',
      draggerPosition: 0,
      draggerPositionB: 0,
      draggerVisible: true,
      draggerVisibleB: false,
      hoverTime: '',
      hoverLinePosition: 0,
      showHoverLine: false,
      showDraggerTime: false,
      isDraggerDragging: false,
      isAnimationDraggerDragging: false,
      isTimelineDragging: false,
      initialLoadComplete: false,
      timelineHidden: false,
      hasMoved: false,
      customIntervalModalOpen: false,
      rangeSelectorMax: { end: false, start: false, startOffset: -50, width: 50000 }
    };
    // left/right arrows
    this.debounceDateUpdate = lodashDebounce(this.props.changeDate, 50);
    this.throttleDecrementDate = lodashThrottle(this.handleArrowDateChange.bind(this, -1), ANIMATION_DELAY, { leading: true, trailing: false });
    this.throttleIncrementDate = lodashThrottle(this.handleArrowDateChange.bind(this, 1), ANIMATION_DELAY, { leading: true, trailing: false });

    // animation dragger updates
    this.debounceOnUpdateStartDate = lodashDebounce(this.props.onUpdateStartDate, 30);
    this.debounceOnUpdateEndDate = lodashDebounce(this.props.onUpdateEndDate, 30);
    this.debounceOnUpdateStartAndEndDate = lodashDebounce(this.props.onUpdateStartAndEndDate, 30);

    // application relative now time
    this.appNowUpdateInterval = 0;
  }

  // HOVER TIME
  /**
  * @desc display date based on hover grid tile
  * @param {String} date
  * @param {Number} leftOffset
  * @returns {void}
  */
  displayDate = (date, leftOffset) => {
    requestAnimationFrame(() => {
      this.setState({
        hoverTime: date,
        leftOffset: leftOffset - this.props.parentOffset // relative location from parent bounding box of mouse hover position (i.e. BLUE LINE)
      });
    });
  }

  /**
  * @desc show hover line
  * @param {Event} mouse event
  * @returns {void}
  */
  showHoverOn = () => {
    if (!this.state.showHoverLine && !this.state.showDraggerTime) {
      this.setState({
        showHoverLine: true
      });
    }
  }

  /**
  * @desc hide hover line
  * @returns {void}
  */
  showHoverOff = () => {
    if (this.state.showHoverLine === true) {
      this.setState({
        showHoverLine: false
      });
    }
  }

  /**
  * @desc toggle dragger time on/off
  * @param {Boolean} toggleBoolean
  * @returns {void}
  */
  toggleShowDraggerTime = (toggleBoolean) => {
    this.setState({
      showDraggerTime: toggleBoolean,
      showHoverLine: false,
      isDraggerDragging: toggleBoolean
    });
  }

  /**
  * @desc handle svg blue line axis hover
  * @param {Event} mouse event
  * @param {String} itemDate
  * @param {String} nextDate
  * @param {Number} index
  * @returns {void}
  */
  showHover = (e, itemDate, nextDate, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.persist();
    requestAnimationFrame(() => {
      let {
        position,
        transformX
      } = this.state;
      let {
        timeScale,
        timelineStartDateLimit,
        timelineEndDateLimit
      } = this.props;

      let options = timeScaleOptions[timeScale].timeAxis;
      let gridWidth = options.gridWidth;

      let target = e.target;
      let clientX = e.clientX;
      let boundingClientRect = target.getBoundingClientRect();
      let xHoverPositionInCurrentGrid = Math.floor(clientX) - Math.floor(boundingClientRect.left);

      let currentDateValue = new Date(itemDate).getTime();
      let nextDateValue = new Date(nextDate).getTime();
      let diff = nextDateValue - currentDateValue;
      let diffFactor = diff / gridWidth;
      let displayDateValue = currentDateValue + xHoverPositionInCurrentGrid * diffFactor;

      let isBetweenValidTimeline = getIsBetween(displayDateValue, timelineStartDateLimit, timelineEndDateLimit);
      if (isBetweenValidTimeline) {
        let displayDateFormat = getISODateFormatted(displayDateValue);
        this.displayDate(displayDateFormat, clientX);
        this.setState({
          hoverLinePosition: index * gridWidth + xHoverPositionInCurrentGrid + transformX + position
        });
      }
    });
  }

  /**
  * @desc handles dynamic position changes from axis that affect dragger and range select
  * @param {Object} args
    * @param {Boolean} hasMoved
    * @param {Boolean} isTimelineDragging
    * @param {Number} position
    * @param {Number} transformX
    * @param {String} frontDate
    * @param {String} backDate
    * @param {Number} draggerPosition
    * @param {Number} draggerPositionB
    * @param {Boolean} draggerVisible
    * @param {Boolean} draggerVisibleB
    * @param {Number} animationStartLocation
    * @param {Number} animationEndLocation
  * @param {String} hoverTime - defaults to state
  * @returns {void}
  */
  updatePositioning = ({
    hasMoved,
    isTimelineDragging,
    position,
    transformX,
    frontDate,
    backDate,
    draggerPosition,
    draggerPositionB,
    draggerVisible,
    draggerVisibleB,
    animationStartLocation,
    animationEndLocation
  }, hoverTime = this.state.hoverTime) => {
    this.setState({
      hasMoved,
      isTimelineDragging,
      showHoverLine: false,
      position,
      transformX,
      frontDate,
      backDate,
      draggerPosition,
      draggerPositionB,
      draggerVisible,
      draggerVisibleB,
      animationStartLocation,
      animationEndLocation,
      hoverTime: hoverTime
    });
  }

  /**
  * @desc handles dynamic positioning update based on simple drag
  * @param {Object} args
    * @param {Boolean} hasMoved
    * @param {Boolean} isTimelineDragging
    * @param {Number} position
    * @param {Number} draggerPosition
    * @param {Number} draggerPositionB
    * @param {Number} animationStartLocation
    * @param {Number} animationEndLocation
  * @returns {void}
  */
  updatePositioningOnSimpleDrag = ({
    hasMoved,
    isTimelineDragging,
    position,
    draggerPosition,
    draggerPositionB,
    animationStartLocation,
    animationEndLocation
  }) => {
    this.setState({
      hasMoved,
      isTimelineDragging,
      showHoverLine: false,
      position,
      draggerPosition,
      draggerPositionB,
      animationStartLocation,
      animationEndLocation
    });
  }

  /**
  * @desc handles dynamic positioning update based on axis drag stop event
  * @param {Object} args
    * @param {Boolean} hasMoved
    * @param {Boolean} isTimelineDragging
    * @param {Number} position
    * @param {Number} transformX
  * @param {String} hoverTime - defaults to state
  * @returns {void}
  */
  updatePositioningOnAxisStopDrag = ({
    hasMoved,
    isTimelineDragging,
    position,
    transformX
  }, hoverTime = this.state.hoverTime) => {
    this.setState({
      hasMoved,
      isTimelineDragging,
      showHoverLine: false,
      position,
      transformX,
      hoverTime
    });
  }

  /**
  * @desc update is timeline moved (drag timeline vs. click) and if timeline is dragging
  * @param {Boolean} hasMoved
  * @param {Boolean} isTimelineDragging
  * @returns {void}
  */
  updateTimelineMoveAndDrag = (hasMoved, isTimelineDragging) => {
    this.setState({
      hasMoved,
      isTimelineDragging
    });
  }

  /**
  * @desc handle left/right arrow decrement/increment date
  * @param {Number} signconstant - used to determine if decrement (-1) or increment (1)
  * @returns {void}
  */
  handleArrowDateChange(signconstant) {
    const {
      customSelected,
      deltaChangeAmt,
      timeScaleChangeUnit,
      endTime,
      startDate,
      selectedDate
    } = this.props;

    let delta = customSelected && deltaChangeAmt ? deltaChangeAmt : 1;
    let timeScale = timeScaleChangeUnit;
    if (timeScale) { // undefined custom will not allow arrow change
      delta = Number(delta * signconstant); // determine if negative or positive change
      var nextTime = getNextTimeSelection(delta, timeScale, selectedDate);
      if (new Date(startDate) <= nextTime && nextTime <= endTime) {
        this.onDateChange(util.dateAdd(selectedDate, timeScale, delta));
      }
    }
  };
  /**
  * @desc stop animation from left arrows - clear throttle invocation
  * @returns {void}
  */
  stopLeftArrow = () => {
    this.throttleDecrementDate.cancel();
  }
  /**
  * @desc stop animation from right arrows - clear throttle invocation
  * @returns {void}
  */
  stopRightArrow = () => {
    this.throttleIncrementDate.cancel();
  }
  /**
  * @desc handles left/right arrow down to decrement/increment date
  * @param {Event} mouse event
  * @returns {void}
  */
  handleKeyDown = (e) => {
    // prevent left/right arrows changing date within inputs
    if (e.target.tagName !== 'INPUT') {
      // left arrow
      if (e.keyCode === 37) {
        e.preventDefault();
        this.throttleDecrementDate();
      // right arrow
      } else if (e.keyCode === 39) {
        e.preventDefault();
        this.throttleIncrementDate();
      }
    }
  };
  /**
  * @desc handles stopping change date in process and to allow faster key downs
  * @param {Event} mouse event
  * @returns {void}
  */
  handleKeyUp = (e) => {
    // left arrow
    if (e.keyCode === 37) {
      e.preventDefault();
      this.stopLeftArrow();
    // right arrow
    } else if (e.keyCode === 39) {
      e.preventDefault();
      this.stopRightArrow();
    }
  };

  /**
  * @desc show/hide custom interval modal
  * @param {Boolean} isOpen
  * @returns {void}
  */
  toggleCustomIntervalModal = (isOpen) => {
    this.setState({
      customIntervalModalOpen: isOpen
    });
  };

  /**
  * @desc Change the timescale parent state
  * @param {Number} timeScaleNumber
  * @returns {void}
  */
  changeTimeScale = (timeScale) => {
    this.props.changeTimeScale(timeScale);
  };

  /**
  * @desc handle SET of custom time scale panel
  * @param {Number} delta
  * @param {Number} timeScale
  * @returns {void}
  */
  changeCustomInterval = (delta, timeScale) => {
    this.props.changeCustomInterval(delta, timeScale);
  };

  /**
  * @desc handle SELECT of LEFT/RIGHT interval selection
  * @param {String} timeScale
  * @param {Boolean} modalOpen - is custom interval modal open
  * @returns {void}
  */
  setTimeScaleIntervalChangeUnit = (timeScale, modalOpen) => {
    let delta;
    let { customIntervalZoomLevel, customIntervalValue } = this.props;
    let customSelected = timeScale === 'custom';
    if (customSelected && customIntervalZoomLevel && customIntervalValue) {
      timeScale = customIntervalZoomLevel;
      delta = customIntervalValue;
    } else {
      timeScale = Number(timeScaleToNumberKey[timeScale]);
      delta = 1;
    }
    this.props.selectInterval(delta, timeScale, customSelected);
    this.toggleCustomIntervalModal(modalOpen);
  };

  /**
  * @desc open animation widget
  * @returns {void}
  */
  clickAnimationButton = () => {
    if (this.props.isAnimationWidgetOpen) {
      this.props.closeAnimation();
    } else {
      this.props.openAnimation();
    }
  };

  /**
  * @desc toggle hide timeline
  * @returns {void}
  */
  toggleHideTimeline = () => {
    this.setState({
      timelineHidden: !this.state.timelineHidden
    });
  };

  /**
  * @desc handle animation date dragger updates
  * @param {String} startDate
  * @param {String} endDate
  * @param {Number} startLocation
  * @param {Number} endLocation
  * @param {Boolean} isDragging
  * @returns {void}
  */
  updateAnimationDateAndLocation = (startDate, endDate, startLocation, endLocation, isDragging) => {
    this.setState({
      animationStartLocation: startLocation || this.state.animationStartLocation,
      animationEndLocation: endLocation || this.state.animationEndLocation,
      animationStartLocationDate: startDate,
      animationEndLocationDate: endDate,
      isAnimationDraggerDragging: isDragging
    });
    this.determineAnimationDraggerUpdate(startDate, endDate);
  }

  /**
  * @desc handle animation date dragger updates of startDate, endDate, or both
  * @param {String} startDate
  * @param {String} endDate
  * @returns {void}
  */
  determineAnimationDraggerUpdate = (startDate, endDate) => {
    let startChanged = this.props.animStartLocationDate !== startDate;
    let endChanged = this.props.animEndLocationDate !== endDate;
    if (startChanged) {
      if (endChanged) {
        this.debounceOnUpdateStartAndEndDate(startDate, endDate);
      } else {
        this.debounceOnUpdateStartDate(startDate);
      }
    } else {
      if (endChanged) {
        this.debounceOnUpdateEndDate(endDate);
      }
    }
  }

  /**
  * @desc handle animation dragger location and date state update
  * @param {String} startDate
  * @param {String} endDate
  * @returns {void}
  */
  animationDraggerDateUpdateLocal = (startDate, endDate) => {
    let {
      frontDate,
      position,
      transformX
    } = this.state;
    let { timeScale } = this.props;

    let options = timeScaleOptions[timeScale].timeAxis;
    let gridWidth = options.gridWidth;

    let frontDateObj = moment.utc(frontDate);
    let startLocation = frontDateObj.diff(startDate, timeScale, true) * gridWidth;
    let endLocation = frontDateObj.diff(endDate, timeScale, true) * gridWidth;

    this.setState({
      animationStartLocation: position - startLocation + transformX,
      animationEndLocation: position - endLocation + transformX,
      animationStartLocationDate: startDate,
      animationEndLocationDate: endDate
    });
  }

  /**
  * @desc handle animation dragger location and date state update and global date update
  * @param {String} startDate
  * @param {String} endDate
  * @returns {void}
  */
  animationDraggerDateUpdate = (startDate, endDate) => {
    const {
      animStartLocationDate,
      animEndLocationDate
    } = this.props;
    // update local state location and date
    this.animationDraggerDateUpdateLocal(startDate, endDate);

    // update global state date if changed
    const didStartDateChange = startDate.getTime() !== animStartLocationDate.getTime();
    const didEndDateChange = endDate.getTime() !== animEndLocationDate.getTime();
    if (didStartDateChange || didEndDateChange) {
      this.debounceOnUpdateStartAndEndDate(startDate, endDate);
    }
  }

  // DRAGGER
  /**
  * @desc update state dragger position and if new date, change store date
  * @param {String} newDate - new dragger date
  * @param {String} draggerSelected
  * @param {Number} draggerPosition
  * @param {Boolean} draggerVisible
  * @param {Boolean} otherDraggerVisible
  * @param {Boolean} hasMoved
  * @returns {void}
  */
  updateDraggerDatePosition = (newDate, draggerSelected, draggerPosition, draggerVisible, otherDraggerVisible, hasMoved) => {
    if (draggerSelected === 'selected') {
      this.setState({
        draggerPosition: draggerPosition || this.state.draggerPosition,
        draggerVisible: draggerVisible || this.state.draggerVisible,
        draggerVisibleB: otherDraggerVisible || this.state.draggerVisibleB,
        draggerTimeState: newDate || this.state.draggerTimeState,
        hasMoved: hasMoved || this.state.hasMoved
      });
      if (newDate) {
        this.onDateChange(newDate, 'selected');
      }
    } else {
      this.setState({
        draggerPositionB: draggerPosition || this.state.draggerPositionB,
        draggerVisible: otherDraggerVisible || this.state.draggerVisible,
        draggerVisibleB: draggerVisible || this.state.draggerVisibleB,
        draggerTimeStateB: newDate || this.state.draggerTimeStateB,
        hasMoved: hasMoved || this.state.hasMoved
      });
      if (newDate) {
        this.onDateChange(newDate, 'selectedB');
      }
    }
  }

  /**
  * @desc set dragger visibility
  * @param {Boolean} draggerVisible
  * @param {Boolean} draggerVisibleB
  * @returns {void}
  */
  setDraggerVisibility = (draggerVisible, draggerVisibleB) => {
    this.setState({
      draggerVisible,
      draggerVisibleB
    });
  }

  static getDerivedStateFromProps(props, currentState) {
    // Update animation Date states when animation is initiated
    if (!currentState.animationEndLocationDate && !currentState.animationStartLocationDate && props.animStartLocationDate && props.animEndLocationDate) {
      let { position, transformX } = currentState;
      let { timeScale } = props;
      let startDate = props.animStartLocationDate;
      let endDate = props.animEndLocationDate;
      let options = timeScaleOptions[timeScale].timeAxis;
      let gridWidth = options.gridWidth;

      let frontDate = moment.utc(currentState.frontDate);
      let startLocation = frontDate.diff(startDate, timeScale, true) * gridWidth;
      let endLocation = frontDate.diff(endDate, timeScale, true) * gridWidth;
      return {
        animationStartLocationDate: props.animStartLocationDate,
        animationEndLocationDate: props.animEndLocationDate,
        animationStartLocation: position - startLocation + transformX,
        animationEndLocation: position - endLocation + transformX
      };
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState) {
    let prevStartLocationDate = prevProps.animStartLocationDate;
    let prevEndLocationDate = prevProps.animEndLocationDate;

    let {
      animStartLocationDate,
      animEndLocationDate,
      dateA,
      dateB,
      isAnimationPlaying,
      isAnimationWidgetOpen,
      isGifActive,
      isTourActive,
      customSelected,
      customIntervalValue,
      customIntervalZoomLevel,
      timeScale,
      timeScaleChangeUnit,
      deltaChangeAmt
    } = this.props;

    // handle update animation positioning and local state from play button/gif creation
    const didAnimationTurnOn = !prevProps.isAnimationPlaying && isAnimationPlaying;
    const didGifTurnOn = !prevProps.isGifActive && isGifActive;
    if (didAnimationTurnOn || didGifTurnOn) {
      this.animationDraggerDateUpdateLocal(animStartLocationDate, animEndLocationDate);
    }

    // handle location update triggered from animation start/end date change from animation widget
    if (isAnimationWidgetOpen) {
      if (prevStartLocationDate && prevEndLocationDate) {
        const animStartDateChanged = prevStartLocationDate.getTime() !== animStartLocationDate.getTime();
        const animEndDateChanged = prevEndLocationDate.getTime() !== animEndLocationDate.getTime();
        const frontDateChanged = prevState.frontDate !== this.state.frontDate;
        if (animStartDateChanged || animEndDateChanged || frontDateChanged) {
          this.animationDraggerDateUpdate(animStartLocationDate, animEndLocationDate);
        }
      }

      // handle open/close custom interval panel if 'custom' selected in animation widget
      // and no custom value has been initialized
      if (customIntervalValue === 1 && customIntervalZoomLevel === 3) {
        if (!prevProps.customSelected && customSelected) {
          this.toggleCustomIntervalModal(true);
        }
        if (prevProps.customSelected && !customSelected) {
          this.toggleCustomIntervalModal(false);
        }
      }
    }
    if (dateA !== prevProps.dateA && dateA !== this.state.draggerTimeState) {
      this.updateDraggerTimeState(dateA, false);
    }
    if (dateB !== prevProps.dateB && dateB !== this.state.draggerTimeStateB) {
      this.updateDraggerTimeState(dateB, true);
    }

    // on tour page change, will update interval to selectedzoom if differs
    // (e.g., 'month' zoom will default to 'month' interval)
    // TODO: investigate how to handle this page update better - this limits functionality when in tour mode
    if (isTourActive) {
      if (timeScale !== prevProps.timeScale && prevProps.timeScaleChangeUnit !== timeScale) {
        if (timeScale !== timeScaleChangeUnit && !customSelected) {
          this.props.selectInterval(deltaChangeAmt, timeScaleToNumberKey[timeScale], false);
        }
      }
    }
  }

  /**
  * @desc update dragger time state
  * @param {String} date
  * @param {Boolean} is dragger B selected to update
  * @returns {void}
  */
  updateDraggerTimeState = (date, isDraggerB) => {
    if (isDraggerB) {
      this.setState({
        draggerTimeStateB: date
      });
    } else {
      this.setState({
        draggerTimeState: date
      });
    }
  }

  componentDidMount() {
    let {
      timeScale,
      timeScaleChangeUnit,
      deltaChangeAmt,
      customSelected,
      updateAppNow,
      selectInterval
    } = this.props;

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    // prevent default react synthetic event passive event listener
    // that allows browser resize/zoom on certain wheel events
    document.querySelector('.timeline-container').addEventListener('wheel', (e) => {
      e.preventDefault();
    }, { passive: false });

    // update application relative every 10 minutes from component mount
    this.appNowUpdateInterval = setInterval(() => updateAppNow(new Date()), 600000);
    this.setInitialState();

    // update interval selectedzoom level as default
    if (timeScale !== timeScaleChangeUnit && !customSelected) {
      selectInterval(deltaChangeAmt, timeScaleToNumberKey[timeScale], false);
    }
  }

  componentWillUnmount() {
    clearInterval(this.appNowUpdateInterval);
  }

  setInitialState = () => {
    let {
      dateA,
      dateB
    } = this.props;
    this.setState({
      draggerTimeState: dateA,
      draggerTimeStateB: dateB,
      hoverTime: dateA,
      initialLoadComplete: true
    });
  }

  /**
  * @desc change store date
  * @param {String} date
  * @param {String} draggerSelected - default to props draggerSelected
  * @returns {void}
  */
  onDateChange = (date, draggerSelected = this.props.draggerSelected) => {
    let dateObj = new Date(date);
    let dateISOFormatted = getISODateFormatted(date);
    if (draggerSelected === 'selected') { // dragger A
      this.setState({
        draggerTimeState: dateISOFormatted
      });
    } else { // dragger B
      this.setState({
        draggerTimeStateB: dateISOFormatted
      });
    }
    this.debounceDateUpdate(dateObj, draggerSelected);
  }

  render() {
    const {
      dateA,
      dateB,
      hasSubdailyLayers,
      draggerSelected,
      leftArrowDisabled,
      rightArrowDisabled,
      customSelected,
      customIntervalValue,
      customIntervalZoomLevel,
      isAnimationPlaying,
      isCompareModeActive,
      axisWidth,
      timelineEndDateLimit,
      timelineStartDateLimit,
      timeScaleChangeUnit,
      animStartLocationDate,
      animEndLocationDate,
      isAnimationWidgetOpen,
      animationDisabled,
      hideTimeline,
      timeScale,
      isSmallScreen,
      toggleActiveCompareState,
      parentOffset,
      isTourActive,
      isDataDownload
    } = this.props;
    let {
      initialLoadComplete,
      timelineHidden,
      draggerTimeState,
      draggerTimeStateB,
      draggerPosition,
      draggerPositionB,
      draggerVisible,
      draggerVisibleB,
      animationStartLocationDate,
      animationEndLocationDate,
      animationStartLocation,
      animationEndLocation,
      rangeSelectorMax,
      transformX,
      position,
      leftOffset,
      hoverTime,
      frontDate,
      backDate,
      isTimelineDragging,
      isDraggerDragging,
      isAnimationDraggerDragging,
      customIntervalModalOpen,
      showHoverLine,
      showDraggerTime,
      hoverLinePosition,
      hasMoved
    } = this.state;
    let selectedDate = draggerSelected === 'selected' ? draggerTimeState : draggerTimeStateB;
    let isTimelineHidden = timelineHidden || hideTimeline;
    return (
      <div className="timeline-container">
        {initialLoadComplete
          ? <ErrorBoundary>
            {isSmallScreen
              ? <MobileDatePicker
                date={selectedDate}
                startDateLimit={timelineStartDateLimit}
                endDateLimit={timelineEndDateLimit}
                onDateChange={this.onDateChange}
                hasSubdailyLayers={hasSubdailyLayers}
              />
              : <section id="timeline" className="timeline-inner clearfix">
                <div id="timeline-header"
                  className={hasSubdailyLayers ? 'subdaily' : ''}
                >
                  <div id="date-selector-main">
                    <DateSelector
                      date={new Date(selectedDate)}
                      draggerSelected={draggerSelected}
                      onDateChange={this.onDateChange}
                      maxDate={new Date(timelineEndDateLimit)}
                      minDate={new Date(timelineStartDateLimit)}
                      hasSubdailyLayers={hasSubdailyLayers}
                      fontSize={24}
                    />
                  </div>
                  <div id="zoom-buttons-group">
                    <TimeScaleIntervalChange
                      setTimeScaleIntervalChangeUnit={this.setTimeScaleIntervalChangeUnit}
                      customIntervalZoomLevel={timeScaleFromNumberKey[customIntervalZoomLevel]}
                      customSelected={customSelected}
                      customDelta={customIntervalValue}
                      timeScaleChangeUnit={timeScaleChangeUnit}
                    />
                    <DateChangeArrows
                      leftArrowDown={this.throttleDecrementDate}
                      leftArrowUp={this.stopLeftArrow}
                      leftArrowDisabled={leftArrowDisabled}
                      rightArrowDown={this.throttleIncrementDate}
                      rightArrowUp={this.stopRightArrow}
                      rightArrowDisabled={rightArrowDisabled}
                    />
                  </div>
                  <AnimationButton
                    clickAnimationButton={this.clickAnimationButton}
                    disabled={animationDisabled}
                    title={isCompareModeActive ? 'Animation feature is deactivated when Compare feature is active' : isDataDownload ? 'Animation feature is deactivated when Data Download feature is active' : ''}
                  />
                </div>

                <div id="timeline-footer"
                  style={{
                    display:
                      isTimelineHidden ? 'none' : 'block'
                  }}
                >
                  {/* Axis */}
                  <TimelineAxis
                    axisWidth={axisWidth}
                    parentOffset={parentOffset}
                    leftOffset={leftOffset}
                    position={position}
                    transformX={transformX}
                    timeScale={timeScale}
                    timelineStartDateLimit={timelineStartDateLimit}
                    timelineEndDateLimit={timelineEndDateLimit}
                    frontDate={frontDate}
                    backDate={backDate}
                    dateA={dateA}
                    dateB={dateB}
                    hoverTime={hoverTime}
                    draggerSelected={draggerSelected}
                    draggerTimeState={draggerTimeState}
                    draggerTimeStateB={draggerTimeStateB}
                    draggerPosition={draggerPosition}
                    draggerPositionB={draggerPositionB}
                    draggerVisible={draggerVisible}
                    draggerVisibleB={draggerVisibleB}
                    animationStartLocation={animationStartLocation}
                    animationEndLocation={animationEndLocation}
                    animStartLocationDate={animStartLocationDate}
                    animEndLocationDate={animEndLocationDate}
                    changeTimeScale={this.changeTimeScale}
                    updatePositioning={this.updatePositioning}
                    updateTimelineMoveAndDrag={this.updateTimelineMoveAndDrag}
                    updatePositioningOnSimpleDrag={this.updatePositioningOnSimpleDrag}
                    updatePositioningOnAxisStopDrag={this.updatePositioningOnAxisStopDrag}
                    updateDraggerDatePosition={this.updateDraggerDatePosition}
                    showHoverOn={this.showHoverOn}
                    showHoverOff={this.showHoverOff}
                    showHover={this.showHover}
                    hasSubdailyLayers={hasSubdailyLayers}
                    isCompareModeActive={isCompareModeActive}
                    isAnimationPlaying={isAnimationPlaying}
                    isTourActive={isTourActive}
                    isAnimationDraggerDragging={isAnimationDraggerDragging}
                    isDraggerDragging={isDraggerDragging}
                    isTimelineDragging={isTimelineDragging}
                    hasMoved={hasMoved}
                  />

                  <AxisHoverLine
                    axisWidth={axisWidth}
                    hoverLinePosition={hoverLinePosition}
                    showHoverLine={showHoverLine}
                    isTimelineDragging={isTimelineDragging}
                    isAnimationDraggerDragging={isAnimationDraggerDragging}
                  />

                  {isAnimationWidgetOpen &&
                    !animationDisabled &&
                    this.state.animationStartLocation &&
                    this.state.animationStartLocationDate &&
                    this.state.animationEndLocation &&
                    this.state.animationEndLocationDate
                    ? <TimelineRangeSelector
                      axisWidth={axisWidth}
                      position={position}
                      transformX={transformX}
                      timeScale={timeScale}
                      timelineStartDateLimit={timelineStartDateLimit}
                      timelineEndDateLimit={timelineEndDateLimit}
                      frontDate={frontDate}
                      startLocation={animationStartLocation}
                      endLocation={animationEndLocation}
                      startLocationDate={animationStartLocationDate}
                      endLocationDate={animationEndLocationDate}
                      updateAnimationDateAndLocation={this.updateAnimationDateAndLocation}
                      max={rangeSelectorMax}
                      pinWidth={5}
                      rangeOpacity={0.3}
                      rangeColor={'#45bdff'}
                      startColor={'#40a9db'}
                      startTriangleColor={'#fff'}
                      endColor={'#295f92'}
                      endTriangleColor={'#4b7aab'} />
                    : null
                  }

                  {frontDate
                    ? <DraggerContainer
                      axisWidth={axisWidth}
                      position={position}
                      transformX={transformX}
                      timeScale={timeScale}
                      timelineStartDateLimit={timelineStartDateLimit}
                      timelineEndDateLimit={timelineEndDateLimit}
                      frontDate={frontDate}
                      backDate={backDate}
                      draggerSelected={draggerSelected}
                      draggerTimeState={draggerTimeState}
                      draggerTimeStateB={draggerTimeStateB}
                      draggerPosition={draggerPosition}
                      draggerPositionB={draggerPositionB}
                      draggerVisible={draggerVisible}
                      draggerVisibleB={draggerVisibleB}
                      setDraggerVisibility={this.setDraggerVisibility}
                      toggleShowDraggerTime={this.toggleShowDraggerTime}
                      onChangeSelectedDragger={toggleActiveCompareState}
                      updateDraggerDatePosition={this.updateDraggerDatePosition}
                      isCompareModeActive={isCompareModeActive}
                      isDraggerDragging={isDraggerDragging}
                      isAnimationPlaying={isAnimationPlaying}
                    />
                    : null }

                  {!isTimelineDragging
                    ? <DateToolTip
                      axisWidth={axisWidth}
                      leftOffset={leftOffset}
                      hoverTime={hoverTime}
                      draggerSelected={draggerSelected}
                      draggerTimeState={draggerTimeState}
                      draggerTimeStateB={draggerTimeStateB}
                      draggerPosition={draggerPosition}
                      draggerPositionB={draggerPositionB}
                      hasSubdailyLayers={hasSubdailyLayers}
                      showDraggerTime={showDraggerTime}
                      showHoverLine={showHoverLine}
                    />
                    : null
                  }

                  {/* custom interval selector */}
                  <CustomIntervalSelectorWidget
                    customDelta={customIntervalValue}
                    customIntervalZoomLevel={customIntervalZoomLevel}
                    toggleCustomIntervalModal={this.toggleCustomIntervalModal}
                    customIntervalModalOpen={customIntervalModalOpen}
                    changeCustomInterval={this.changeCustomInterval}
                    hasSubdailyLayers={hasSubdailyLayers}
                  />
                </div>

                {/* Zoom Level Change */}
                <AxisTimeScaleChange
                  timeScale={timeScale}
                  changeTimeScale={this.changeTimeScale}
                  isDraggerDragging={isDraggerDragging}
                  hasSubdailyLayers={hasSubdailyLayers}
                  timelineHidden={isTimelineHidden}
                />

                {/* Open/Close Chevron */}
                <div id="timeline-hide" onClick={this.toggleHideTimeline}>
                  <div
                    className={`wv-timeline-hide wv-timeline-hide-double-chevron-${
                      isTimelineHidden ? 'left' : 'right'
                    }`}
                  />
                </div>
              </section>
            }
          </ErrorBoundary>
          : null }
      </div>
    );
  }
}
function mapStateToProps(state) {
  const {
    config,
    compare,
    map,
    layers,
    browser,
    date,
    animation,
    sidebar,
    modal,
    tour
  } = state;
  let {
    customSelected,
    selected,
    selectedB,
    selectedZoom,
    interval,
    delta,
    customInterval,
    customDelta,
    appNow
  } = date;
  const { screenWidth, lessThan } = browser;
  const { isCompareA, activeString } = compare;
  const isCompareModeActive = compare.active;
  const isSmallScreen = lessThan.medium;
  let hasSubdailyLayers = hasSubDaily(layers[compare.activeString]);
  customSelected = Boolean(customSelected);

  // handle reset of timescale and intervals if not subdaily
  if (!hasSubdailyLayers) {
    if (selectedZoom > 3) {
      selectedZoom = 3;
    }
    if (interval > 3) {
      interval = 3;
    }
    if (customInterval > 3) {
      customInterval = 3;
    }
  }

  let endTime;
  if (isCompareModeActive) {
    hasSubdailyLayers =
      hasSubDaily(layers['active']) || hasSubDaily(layers['activeB']);
    endTime = getEndTime(layers, config);
  } else {
    hasSubdailyLayers = hasSubDaily(layers[compare.activeString]);
    endTime = layersLastDateTime(layers[activeString], config);
  }
  endTime = appNow;

  const dimensionsAndOffsetValues = getOffsetValues(
    screenWidth,
    hasSubdailyLayers
  );
  const timelineEndDateLimit = getISODateFormatted(endTime);

  let selectedDate = isCompareA ? selected : selectedB;
  let deltaChangeAmt = customSelected ? customDelta : delta;
  let timeScaleChangeUnit = customSelected
    ? timeScaleFromNumberKey[customInterval]
    : timeScaleFromNumberKey[interval];
  let timelineStartDateLimit = config.startDate;
  let leftArrowDisabled = checkLeftArrowDisabled(
    selectedDate,
    deltaChangeAmt,
    timeScaleChangeUnit,
    timelineStartDateLimit
  );
  let rightArrowDisabled = checkRightArrowDisabled(
    selectedDate,
    deltaChangeAmt,
    timeScaleChangeUnit,
    timelineEndDateLimit
  );
  return {
    isTourActive: tour.active,
    isSmallScreen,
    draggerSelected: isCompareA ? 'selected' : 'selectedB',
    hasSubdailyLayers,
    customSelected,
    isCompareModeActive,
    dateA: getISODateFormatted(selected),
    dateB: getISODateFormatted(selectedB),
    startDate: config.startDate,
    timelineStartDateLimit: config.startDate, // same as startDate
    endTime,
    isAnimationWidgetOpen: animation.isActive,
    animStartLocationDate: animation.startDate,
    animEndLocationDate: animation.endDate,
    axisWidth: dimensionsAndOffsetValues.width,
    selectedDate: selectedDate,
    timeScale: timeScaleFromNumberKey[selectedZoom.toString()],
    timeScaleChangeUnit: timeScaleChangeUnit,
    customIntervalValue: customDelta || 1,
    customIntervalZoomLevel: customInterval || 3,
    deltaChangeAmt: deltaChangeAmt,
    parentOffset: dimensionsAndOffsetValues.parentOffset,
    timelineEndDateLimit,
    leftArrowDisabled,
    rightArrowDisabled,
    hideTimeline:
      (modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT') || animation.gifActive,
    animationDisabled:
      !lodashGet(map, 'ui.selected.frameState_') ||
      sidebar.activeTab === 'download' ||
      compare.active,
    isDataDownload: sidebar.activeTab === 'download',
    isAnimationPlaying: animation.isPlaying,
    isGifActive: animation.gifActive
  };
}

const mapDispatchToProps = dispatch => ({
  // updates the relative application now to allow up to date coverage
  updateAppNow: date => {
    dispatch(updateAppNow(date));
  },
  // changes date of active dragger 'selected' or 'selectedB'
  changeDate: val => {
    dispatch(selectDate(val));
  },
  // changes/sets custom delta and timescale interval
  changeCustomInterval: (delta, timeScale) => {
    dispatch(changeCustomInterval(delta, timeScale));
  },
  // changes timescale (scale of grids vs. what LEFT/RIGHT arrow do)
  changeTimeScale: val => {
    dispatch(changeTimeScale(val));
  },
  // changes to non-custom timescale interval, sets customSelected to TRUE/FALSE
  selectInterval: (delta, timeScale, customSelected) => {
    dispatch(selectInterval(delta, timeScale, customSelected));
  },
  openAnimation: () => {
    dispatch(openAnimation());
  },
  closeAnimation: () => {
    dispatch(closeAnimation());
  },
  toggleActiveCompareState: () => {
    dispatch(toggleActiveCompareState());
  },
  // update animation startDate
  onUpdateStartDate: date => {
    dispatch(changeStartDate(date));
  },
  // update animation endDate
  onUpdateEndDate: date => {
    dispatch(changeEndDate(date));
  },
  // update animation startDate and endDate
  onUpdateStartAndEndDate: (startDate, endDate) => {
    dispatch(changeStartAndEndDate(startDate, endDate));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Timeline);

Timeline.propTypes = {
  animationDisabled: PropTypes.bool,
  animEndLocationDate: PropTypes.object,
  animStartLocationDate: PropTypes.object,
  axisWidth: PropTypes.number,
  changeCustomInterval: PropTypes.func,
  changeDate: PropTypes.func,
  changeTimeScale: PropTypes.func,
  closeAnimation: PropTypes.func,
  customIntervalValue: PropTypes.number,
  customIntervalZoomLevel: PropTypes.number,
  customSelected: PropTypes.bool,
  dateA: PropTypes.string,
  dateB: PropTypes.string,
  deltaChangeAmt: PropTypes.number,
  draggerSelected: PropTypes.string,
  endTime: PropTypes.object,
  hasSubdailyLayers: PropTypes.bool,
  hideTimeline: PropTypes.bool,
  isAnimationPlaying: PropTypes.bool,
  isAnimationWidgetOpen: PropTypes.bool,
  isCompareModeActive: PropTypes.bool,
  isDataDownload: PropTypes.bool,
  isGifActive: PropTypes.bool,
  isSmallScreen: PropTypes.bool,
  isTourActive: PropTypes.bool,
  leftArrowDisabled: PropTypes.bool,
  onUpdateEndDate: PropTypes.func,
  onUpdateStartAndEndDate: PropTypes.func,
  onUpdateStartDate: PropTypes.func,
  openAnimation: PropTypes.func,
  parentOffset: PropTypes.number,
  rightArrowDisabled: PropTypes.bool,
  screenWidth: PropTypes.number,
  selectedDate: PropTypes.object,
  selectInterval: PropTypes.func,
  startDate: PropTypes.string,
  timelineEndDateLimit: PropTypes.string,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  timeScaleChangeUnit: PropTypes.string,
  toggleActiveCompareState: PropTypes.func,
  updateAppNow: PropTypes.func
};

// get axisWidth and parentOffset for axis, footer, and leftOffset calculations
const getOffsetValues = (innerWidth, hasSubDaily) => {
  const parentOffset = (hasSubDaily ? 414 : 310) + 10;
  const width = innerWidth - parentOffset - 88;
  return { width, parentOffset };
};

const getEndTime = (layers, config) => {
  const endDateA = layersLastDateTime(layers['active'], config);
  const endDateB = layersLastDateTime(layers['activeB'], config);
  return endDateA > endDateB ? endDateA : endDateB;
};
/**
 * @param  {Number} delta Date and direction to change
 * @param  {Number} increment Zoom level of change
 *                  e.g. months, minutes, years, days
 * @return {Object} JS Date Object
 */
const getNextTimeSelection = (delta, increment, prevDate) => {
  switch (increment) {
    case 'year':
      return new Date(
        new Date(prevDate).setUTCFullYear(prevDate.getUTCFullYear() + delta)
      );
    case 'month':
      return new Date(
        new Date(prevDate).setUTCMonth(prevDate.getUTCMonth() + delta)
      );
    case 'day':
      return new Date(
        new Date(prevDate).setUTCDate(prevDate.getUTCDate() + delta)
      );
    case 'hour':
      return new Date(
        new Date(prevDate).setUTCHours(prevDate.getUTCHours() + delta)
      );
    case 'minute':
      return new Date(
        new Date(prevDate).setUTCMinutes(prevDate.getUTCMinutes() + delta)
      );
  }
};

// check if left arrow should be disabled on predicted decrement
const checkLeftArrowDisabled = (
  date,
  delta,
  timeScaleChangeUnit,
  timelineStartDateLimit
) => {
  let nextDecrementDate = moment.utc(date).subtract(delta, timeScaleChangeUnit);
  let isSameOrBefore = new Date(nextDecrementDate.format()) < new Date(timelineStartDateLimit);
  return isSameOrBefore;
};

// check if right arrow should be disabled on predicted increment
const checkRightArrowDisabled = (
  date,
  delta,
  timeScaleChangeUnit,
  timelineEndDateLimit
) => {
  let nextIncrementDate = moment.utc(date).add(delta, timeScaleChangeUnit);
  let isSameOrAfter = new Date(nextIncrementDate.format()) > new Date(timelineEndDateLimit);
  return isSameOrAfter;
};
