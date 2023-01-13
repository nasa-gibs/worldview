import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import googleTagManager from 'googleTagManager';
import { UncontrolledTooltip } from 'reactstrap';

import {
  debounce as lodashDebounce,
  throttle as lodashThrottle,
  get as lodashGet,
} from 'lodash';
import ErrorBoundary from '../error-boundary';
import MobileDatePicker from '../../components/timeline/mobile-date-picker';

import TimelineAxis from '../../components/timeline/timeline-axis/timeline-axis';
import TimelineLayerCoveragePanel from '../../components/timeline/timeline-coverage/timeline-coverage';
import TimeScaleIntervalChange from '../../components/timeline/timeline-controls/timescale-interval-change';
import DraggerContainer from '../../components/timeline/timeline-draggers/dragger-container';
import AxisHoverLine from '../../components/timeline/timeline-axis/date-tooltip/axis-hover-line';
import DateTooltip from '../../components/timeline/timeline-axis/date-tooltip/date-tooltip';
import CustomIntervalSelector from '../../components/timeline/custom-interval-selector/custom-interval-selector';

import DateSelector from '../../components/date-selector/date-selector';
import DateChangeArrows from '../../components/timeline/timeline-controls/date-change-arrows';

import AnimationButton from '../../components/timeline/timeline-controls/animation-button';
import AxisTimeScaleChange from '../../components/timeline/timeline-controls/axis-timescale-change';
import TimelineRangeSelector from '../../components/range-selection/range-selection';

import {
  getIsBetween,
  getISODateFormatted,
} from '../../components/timeline/date-util';
import {
  dateRange as getDateRange,
  hasSubDaily,
  subdailyLayersActive,
  getActiveLayers,
} from '../../modules/layers/selectors';
import { getSelectedDate, getDeltaIntervalUnit } from '../../modules/date/selectors';
import {
  selectDate as selectDateAction,
  changeTimeScale,
  selectInterval,
  changeCustomInterval as changeCustomIntervalAction,
  updateAppNow,
  toggleCustomModal,
  triggerTodayButton,
} from '../../modules/date/actions';
import {
  checkHasFutureLayers,
  filterProjLayersWithStartDate,
  getNextTimeSelection,
} from '../../modules/date/util';
import { toggleActiveCompareState } from '../../modules/compare/actions';
import {
  onActivate as openAnimation,
  onClose as closeAnimation,
  changeStartAndEndDate,
  changeStartDate,
  changeEndDate,
  toggleAnimationCollapse,
  stop as pauseAnimation,
} from '../../modules/animation/actions';
import {
  TIME_SCALE_FROM_NUMBER,
  TIME_SCALE_TO_NUMBER,
  timeScaleOptions,
  customModalType,
} from '../../modules/date/constants';
import util from '../../util/util';

import MobileComparisonToggle from '../../components/compare/mobile-toggle';

const preventDefaultFunc = (e) => {
  e.preventDefault();
};

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
      isAnimationDraggerDragging: false,
      isDraggerDragging: false,
      isTimelineDragging: false,
      initialLoadComplete: false,
      timelineHidden: false,
      rangeSelectorMax: {
        end: false, start: false, startOffset: -50, width: 50000,
      },
      matchingTimelineCoverage: {},
      isTimelineLayerCoveragePanelOpen: false,
      shouldIncludeHiddenLayers: false,
    };

    const {
      selectDate,
      onUpdateStartDate,
      onUpdateEndDate,
      onUpdateStartAndEndDate,
    } = this.props;

    // left/right arrows
    const throttleSettings = { leading: true, trailing: false };
    this.debounceDateUpdate = lodashDebounce(selectDate, 8);

    // animation dragger updates
    this.debounceOnUpdateStartDate = lodashDebounce(onUpdateStartDate, 30);
    this.debounceOnUpdateEndDate = lodashDebounce(onUpdateEndDate, 30);
    this.debounceOnUpdateStartAndEndDate = lodashDebounce(onUpdateStartAndEndDate, 30);

    // change timescale
    this.debounceWheelTime = 60;
    this.debounceChangeTimeScaleWheel = lodashDebounce(this.throttleChangeTimeScaleWheel, this.debounceWheelTime, throttleSettings);
    this.throttleChangeTimeScaleWheelFire = lodashThrottle(this.changeTimeScaleScroll, 200, throttleSettings);

    // application relative now time
    this.appNowUpdateInterval = 0;
  }

  static getDerivedStateFromProps(props, currentState) {
    // Update animation Date states when animation is initiated
    if (!currentState.animationEndLocationDate
      && !currentState.animationStartLocationDate
      && props.animStartLocationDate
      && props.animEndLocationDate) {
      const { position, transformX } = currentState;
      const { timeScale } = props;
      const startDate = props.animStartLocationDate;
      const endDate = props.animEndLocationDate;
      const options = timeScaleOptions[timeScale].timeAxis;
      const { gridWidth } = options;

      const frontDate = moment.utc(currentState.frontDate);
      const startLocation = frontDate.diff(startDate, timeScale, true) * gridWidth;
      const endLocation = frontDate.diff(endDate, timeScale, true) * gridWidth;
      return {
        animationStartLocationDate: props.animStartLocationDate,
        animationEndLocationDate: props.animEndLocationDate,
        animationStartLocation: position - startLocation + transformX,
        animationEndLocation: position - endLocation + transformX,
      };
    }
    return null;
  }

  componentDidMount() {
    const {
      nowOverride,
    } = this.props;
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    // prevent default react synthetic event passive event listener
    // that allows browser resize/zoom on certain wheel events
    document.querySelector('.timeline-container').addEventListener('wheel', preventDefaultFunc, { passive: false });

    // appNow will not update if set in query string using 'now' parameter
    if (!nowOverride) {
      this.checkAndUpdateAppNow = this.checkAndUpdateAppNow.bind(this);
      this.appNowUpdateInterval = setInterval(this.checkAndUpdateAppNow, 60000 * 10);
    }

    this.setInitialState();
  }

  componentDidUpdate(prevProps, prevState) {
    const prevStartLocationDate = prevProps.animStartLocationDate;
    const prevEndLocationDate = prevProps.animEndLocationDate;
    const {
      animStartLocationDate,
      animEndLocationDate,
      changeCustomInterval,
      customInterval,
      customSelected,
      dateA,
      dateB,
      interval,
      isAnimationPlaying,
      isAnimationWidgetOpen,
      isGifActive,
      hasSubdailyLayers,
    } = this.props;
    const { frontDate, draggerTimeState, draggerTimeStateB } = this.state;


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
        const frontDateChanged = prevState.frontDate !== frontDate;
        if (animStartDateChanged || animEndDateChanged || frontDateChanged) {
          this.animationDraggerDateUpdate(animStartLocationDate, animEndLocationDate);
        }
      }
    }

    const subdailyAdded = hasSubdailyLayers && !prevProps.hasSubdailyLayers;
    const subdailyRemoved = !hasSubdailyLayers && prevProps.hasSubdailyLayers;
    const subdailyInterval = customInterval > 3 || interval > 3;

    if (subdailyRemoved && subdailyInterval) {
      changeCustomInterval();
      selectInterval(1, TIME_SCALE_TO_NUMBER.day, false);
    }

    if (subdailyAdded && !customSelected) {
      changeCustomInterval(10, TIME_SCALE_TO_NUMBER.minute);
    }

    // if user adds a subdaily layer (and none were active) change the time scale to hourly
    if (hasSubdailyLayers && !prevProps.hasSubdailyLayers) {
      this.changeTimeScale(4);
    }

    if (dateA !== prevProps.dateA && dateA !== draggerTimeState) {
      this.updateDraggerTimeState(dateA, false);
    }
    if (dateB !== prevProps.dateB && dateB !== draggerTimeStateB) {
      this.updateDraggerTimeState(dateB, true);
    }
  }

  componentWillUnmount() {
    if (this.appNowUpdateInterval) clearInterval(this.appNowUpdateInterval);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.querySelector('.timeline-container').removeEventListener('wheel', preventDefaultFunc);
  }

  // chain throttled timescale wheel change call after debounce for smoother UX
  throttleChangeTimeScaleWheel = (e) => {
    this.throttleChangeTimeScaleWheelFire(e);
  };

  // HOVER TIME
  /**
  * @desc display date based on hover grid tile
  * @param {String} date
  * @param {Number} leftOffset
  * @returns {void}
  */
  displayDate = (date, leftOffset) => {
    const { parentOffset } = this.props;
    requestAnimationFrame(() => {
      this.setState({
        hoverTime: date,
        leftOffset: leftOffset - parentOffset, // relative location from parent bounding box of mouse hover position (i.e. BLUE LINE)
      });
    });
  };

  /**
  * @desc show hover line
  * @param {Event} mouse event
  * @returns {void}
  */
  showHoverOn = () => {
    const { showHoverLine, showDraggerTime } = this.state;
    if (!showHoverLine && !showDraggerTime) {
      this.setState({
        showHoverLine: true,
      });
    }
  };

  /**
  * @desc hide hover line
  * @returns {void}
  */
  showHoverOff = () => {
    const { showHoverLine } = this.state;
    if (showHoverLine === true) {
      this.setState({
        showHoverLine: false,
      });
    }
  };

  /**
  * @desc toggle dragger time on/off
  * @param {Boolean} toggleBoolean
  * @returns {void}
  */
  toggleShowDraggerTime = (toggleBoolean) => {
    this.setState({
      showDraggerTime: toggleBoolean,
      showHoverLine: false,
      isDraggerDragging: toggleBoolean,
    });
  };

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
      const {
        position,
        transformX,
      } = this.state;
      const {
        timeScale,
        timelineStartDateLimit,
        timelineEndDateLimit,
      } = this.props;

      const options = timeScaleOptions[timeScale].timeAxis;
      const { gridWidth } = options;

      const { target } = e;
      const { clientX } = e;
      const boundingClientRect = target.getBoundingClientRect();
      const xHoverPositionInCurrentGrid = Math.floor(clientX) - Math.floor(boundingClientRect.left);

      const currentDateValue = new Date(itemDate).getTime();
      const nextDateValue = new Date(nextDate).getTime();
      const diff = nextDateValue - currentDateValue;
      const diffFactor = diff / gridWidth;
      const displayDateValue = currentDateValue + xHoverPositionInCurrentGrid * diffFactor;

      const isBetweenValidTimeline = getIsBetween(displayDateValue, timelineStartDateLimit, timelineEndDateLimit);
      if (isBetweenValidTimeline) {
        const displayDateFormat = getISODateFormatted(displayDateValue);
        this.displayDate(displayDateFormat, clientX);
        this.setState({
          hoverLinePosition: index * gridWidth + xHoverPositionInCurrentGrid + transformX + position,
        });
      }
    });
  };

  /**
  * @desc handles dynamic position changes from axis that affect dragger and range select
  * @param {Object} args
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
    animationEndLocation,
  // eslint-disable-next-line react/destructuring-assignment
  }, hoverTime = this.state.hoverTime) => {
    this.setState({
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
      hoverTime,
    });
  };

  /**
  * @desc handles dynamic positioning update based on simple drag
  * @param {Object} args
    * @param {Number} position
    * @param {Number} draggerPosition
    * @param {Number} draggerPositionB
    * @param {Number} animationStartLocation
    * @param {Number} animationEndLocation
  * @returns {void}
  */
  updatePositioningOnSimpleDrag = ({
    position,
    draggerPosition,
    draggerPositionB,
    animationStartLocation,
    animationEndLocation,
  }) => {
    this.setState({
      isTimelineDragging: true,
      showHoverLine: false,
      position,
      draggerPosition,
      draggerPositionB,
      animationStartLocation,
      animationEndLocation,
    });
  };

  /**
  * @desc handles dynamic positioning update based on axis drag stop event
  * @param {Object} args
    * @param {Boolean} isTimelineDragging
    * @param {Number} position
    * @param {Number} transformX
  * @param {String} hoverTime - defaults to state
  * @returns {void}
  */
  updatePositioningOnAxisStopDrag = ({
    isTimelineDragging,
    position,
    transformX,
  // eslint-disable-next-line react/destructuring-assignment
  }, hoverTime = this.state.hoverTime) => {
    this.setState({
      isTimelineDragging,
      showHoverLine: false,
      position,
      transformX,
      hoverTime,
    });
  };

  /**
  * @desc update is timeline moved (drag timeline vs. click) and if timeline is dragging
  * @param {Boolean} isTimelineDragging
  * @returns {void}
  */
  updateTimelineMoveAndDrag = (isTimelineDragging) => {
    this.setState({
      isTimelineDragging,
    });
  };

  /**
  * @desc handle left/right arrow decrement/increment date
  * @param {Number} signConstant - used to determine if decrement (-1) or increment (1)
  * @returns {void}
  */
  handleArrowDateChange(signConstant) {
    const {
      customSelected,
      deltaChangeAmt,
      timeScaleChangeUnit,
      selectedDate,
      rightArrowDisabled,
      leftArrowDisabled,
      timelineEndDateLimit,
      timelineStartDateLimit,
    } = this.props;

    let delta = customSelected && deltaChangeAmt ? deltaChangeAmt : 1;
    if (!timeScaleChangeUnit) { // undefined custom will not allow arrow change
      return;
    }
    delta = Number(delta * signConstant); // determine if negative or positive change
    const disabled = signConstant > 0 ? rightArrowDisabled : leftArrowDisabled;
    if (!disabled) {
      const minDate = new Date(timelineStartDateLimit);
      const maxDate = new Date(timelineEndDateLimit);
      this.onDateChange(getNextTimeSelection(delta, timeScaleChangeUnit, selectedDate, minDate, maxDate));
    }
  }

  /**
  * @desc handles left/right arrow down to decrement/increment date
  * @param {Event} mouse event
  * @returns {void}
  */
  handleKeyDown = (e) => {
    const { isTimelineDragging } = this.state;
    const { hasSubdailyLayers, timeScale } = this.props;
    // prevent left/right arrows changing date within inputs
    if (e.target.tagName !== 'INPUT' && e.target.className !== 'rc-slider-handle' && !e.ctrlKey && !e.metaKey && !isTimelineDragging) {
      const timeScaleNumber = Number(TIME_SCALE_TO_NUMBER[timeScale]);
      const maxTimeScaleNumber = hasSubdailyLayers ? 5 : 3;
      if (e.keyCode === 38) {
        e.preventDefault();
        if (timeScaleNumber > 1) {
          this.changeTimeScale(timeScaleNumber - 1);
        }
      // down arrow
      } else if (e.keyCode === 40) {
        e.preventDefault();
        if (timeScaleNumber < maxTimeScaleNumber) {
          this.changeTimeScale(timeScaleNumber + 1);
        }
      }
    }
  };

  /**
  * @desc show/hide custom interval modal
  * @param {Boolean} isOpen
  * @returns {void}
  */
  toggleCustomIntervalModal = (isOpen) => {
    const { toggleCustomModal } = this.props;
    toggleCustomModal(isOpen, customModalType.TIMELINE);
  };

  /**
  * @desc Change the timescale parent state
  * @param {Number} timeScaleNumber
  * @returns {void}
  */
  changeTimeScale = (timeScale) => {
    const { changeTimeScale } = this.props;
    this.setState({
      showHoverLine: false,
      showDraggerTime: false,
    });
    changeTimeScale(timeScale);
  };

  /**
  * @desc changes timeScale with wheel scroll - throttled invocations
  * y axis change - change timescale scroll (e.g. from 'day' to 'month')
  * @param {Event} wheel scroll event
  * @returns {void}
  */
  changeTimeScaleScroll = (e) => {
    const {
      timeScale,
      hasSubdailyLayers,
    } = this.props;
    const timeScaleNumber = Number(TIME_SCALE_TO_NUMBER[timeScale]);
    const maxTimeScaleNumber = hasSubdailyLayers ? 5 : 3;

    // handle time scale change on y axis wheel event
    // wheel zoom out
    if (e.deltaY > 0) {
      if (timeScaleNumber > 1) {
        this.changeTimeScale(timeScaleNumber - 1);
      }
      // wheel zoom in
    } else if (timeScaleNumber < maxTimeScaleNumber) {
      this.changeTimeScale(timeScaleNumber + 1);
    }
  };

  /**
  * @desc open animation widget
  * @returns {void}
  */
  clickAnimationButton = () => {
    const {
      closeAnimation,
      isAnimationWidgetOpen,
      openAnimation,
      isMobile,
      onPauseAnimation,
      onToggleAnimationCollapse,
    } = this.props;

    if (isAnimationWidgetOpen && isMobile) {
      onToggleAnimationCollapse();
      onPauseAnimation();
    } else if (isMobile && !isAnimationWidgetOpen) {
      openAnimation();
    } else if (isAnimationWidgetOpen) {
      closeAnimation();
    } else {
      googleTagManager.pushEvent({
        event: 'GIF_setup_animation_button',
      });
      openAnimation();
    }
  };

  /**
  * @desc toggle hide timeline
  * @returns {void}
  */
  toggleHideTimeline = () => {
    const { timelineHidden } = this.state;
    this.setState({
      timelineHidden: !timelineHidden,
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
    const { animationStartLocation, animationEndLocation } = this.state;
    this.setState({
      animationStartLocation: startLocation || animationStartLocation,
      animationEndLocation: endLocation || animationEndLocation,
      animationStartLocationDate: startDate,
      animationEndLocationDate: endDate,
      isAnimationDraggerDragging: isDragging,
    });
    this.determineAnimationDraggerUpdate(startDate, endDate);
  };

  /**
  * @desc handle animation date dragger updates of startDate, endDate, or both
  * @param {String} startDate
  * @param {String} endDate
  * @returns {void}
  */
  determineAnimationDraggerUpdate = (startDate, endDate) => {
    const {
      animStartLocationDate,
      animEndLocationDate,
    } = this.props;
    const startChanged = animStartLocationDate !== startDate;
    const endChanged = animEndLocationDate !== endDate;
    if (startChanged) {
      if (endChanged) {
        this.debounceOnUpdateStartAndEndDate(startDate, endDate);
      } else {
        this.debounceOnUpdateStartDate(startDate);
      }
    } else if (endChanged) {
      this.debounceOnUpdateEndDate(endDate);
    }
  };

  /**
  * @desc handle animation dragger location and date state update
  * @param {String} startDate
  * @param {String} endDate
  * @returns {void}
  */
  animationDraggerDateUpdateLocal = (startDate, endDate) => {
    const {
      frontDate,
      position,
      transformX,
    } = this.state;
    const { timeScale } = this.props;

    const options = timeScaleOptions[timeScale].timeAxis;
    const { gridWidth } = options;

    const frontDateObj = moment.utc(frontDate);
    const startLocation = frontDateObj.diff(startDate, timeScale, true) * gridWidth;
    const endLocation = frontDateObj.diff(endDate, timeScale, true) * gridWidth;

    this.setState({
      animationStartLocation: position - startLocation + transformX,
      animationEndLocation: position - endLocation + transformX,
      animationStartLocationDate: startDate,
      animationEndLocationDate: endDate,
    });
  };

  /**
  * @desc handle animation dragger location and date state update and global date update
  * @param {String} startDate
  * @param {String} endDate
  * @returns {void}
  */
  animationDraggerDateUpdate = (startDate, endDate) => {
    const {
      animStartLocationDate,
      animEndLocationDate,
    } = this.props;
    // update local state location and date
    this.animationDraggerDateUpdateLocal(startDate, endDate);

    // update global state date if changed
    const didStartDateChange = startDate.getTime() !== animStartLocationDate.getTime();
    const didEndDateChange = endDate.getTime() !== animEndLocationDate.getTime();
    if (didStartDateChange || didEndDateChange) {
      this.debounceOnUpdateStartAndEndDate(startDate, endDate);
    }
  };

  // DRAGGER
  /**
  * @desc update state dragger position and if new date, change store date
  * @param {String} newDate - new dragger date
  * @param {String} draggerSelected
  * @param {Number} draggerPositionArg
  * @param {Boolean} draggerVisibleArg
  * @param {Boolean} otherDraggerVisibleArg
  * @returns {void}
  */
  updateDraggerDatePosition = (newDate, draggerSelected, draggerPositionArg, draggerVisibleArg, otherDraggerVisibleArg) => {
    const {
      draggerPosition,
      draggerPositionB,
      draggerVisible,
      draggerVisibleB,
      draggerTimeState,
      draggerTimeStateB,
    } = this.state;
    if (draggerSelected === 'selected') {
      this.setState({
        draggerPosition: draggerPositionArg || draggerPosition,
        draggerVisible: draggerVisibleArg || draggerVisible,
        draggerVisibleB: otherDraggerVisibleArg || draggerVisibleB,
        draggerTimeState: newDate || draggerTimeState,
      });
      if (newDate) {
        this.onDateChange(newDate, 'selected');
      }
    } else {
      this.setState({
        draggerPositionB: draggerPositionArg || draggerPositionB,
        draggerVisible: otherDraggerVisibleArg || draggerVisible,
        draggerVisibleB: draggerVisibleArg || draggerVisibleB,
        draggerTimeStateB: newDate || draggerTimeStateB,
      });
      if (newDate) {
        this.onDateChange(newDate, 'selectedB');
      }
    }
  };

  /**
  * @desc set dragger visibility
  * @param {Boolean} draggerVisible
  * @param {Boolean} draggerVisibleB
  * @returns {void}
  */
  setDraggerVisibility = (draggerVisible, draggerVisibleB) => {
    this.setState({
      draggerVisible,
      draggerVisibleB,
    });
  };

  /**
  * @desc set matching layer coverage range for selected layers timeline
  * @param {Object} dateRange
  * @returns {void}
  */
  setMatchingTimelineCoverage = (dateRange, shouldIncludeHiddenLayers) => {
    this.setState({
      matchingTimelineCoverage: dateRange,
      shouldIncludeHiddenLayers,
    });
  };

  /**
  * @desc toggle layer coverage panel open/closed
  * @param {Boolean} isOpen
  * @returns {void}
  */
  toggleLayerCoveragePanel = (isOpen) => {
    if (isOpen) {
      googleTagManager.pushEvent({
        event: 'open_layer_coverage_panel',
      });
    }
    this.setState({
      isTimelineLayerCoveragePanelOpen: isOpen,
    });
  };

  /**
  * @desc update dragger time state
  * @param {String} date
  * @param {Boolean} is dragger B selected to update
  * @returns {void}
  */
  updateDraggerTimeState = (date, isDraggerB) => {
    if (isDraggerB) {
      this.setState({
        draggerTimeStateB: date,
      });
    } else {
      this.setState({
        draggerTimeState: date,
      });
    }
  };

  /**
   * Make sure user is not currently interacting with the timeline/dragger/scale/etc,
   * then update appNow to current time.
   */
  checkAndUpdateAppNow() {
    const {
      updateAppNow,
    } = this.props;
    const self = this;
    const ensureCanUpdate = function() {
      return new Promise((resolve, reject) => {
        (function waitForSafeUpdate() {
          const {
            isTimelineDragging,
            isDraggerDragging,
            isAnimationDraggerDragging,
          } = self.state;
          const { isAnimationPlaying, arrowDown } = self.props;
          const userIsInteracting = arrowDown || isTimelineDragging || isDraggerDragging || isAnimationDraggerDragging;
          if (!userIsInteracting && !isAnimationPlaying) {
            return resolve();
          }
          setTimeout(waitForSafeUpdate, 1000);
        }());
      });
    };

    ensureCanUpdate().then(() => {
      updateAppNow(util.now());
    });
  }

  setInitialState = () => {
    const {
      dateA,
      dateB,
    } = this.props;
    this.setState({
      draggerTimeState: dateA,
      draggerTimeStateB: dateB,
      hoverTime: dateA,
      initialLoadComplete: true,
    });
  };

  /**
  * @desc change store date
  * @param {String} date
  * @param {String} draggerSelected - default to props draggerSelected
  * @returns {void}
  */
  // eslint-disable-next-line react/destructuring-assignment
  onDateChange = (date, draggerSelected = this.props.draggerSelected) => {
    const dateObj = new Date(date);
    const dateISOFormatted = getISODateFormatted(date);
    if (draggerSelected === 'selected') { // dragger A
      this.setState({
        draggerTimeState: dateISOFormatted,
      });
    } else { // dragger B
      this.setState({
        draggerTimeStateB: dateISOFormatted,
      });
    }
    this.debounceDateUpdate(dateObj, draggerSelected);
  };

  handleSelectNowButton = () => {
    const { triggerTodayButton } = this.props;
    triggerTodayButton();
  };

  /**
  * @desc getMobileDateButtonStyle date change button style for smaller displays
  * @returns {Object} style { left, bottom }
  */
  getMobileDateButtonStyle = () => {
    const {
      hasSubdailyLayers,
      isCompareModeActive,
      isEmbedModeActive,
      screenWidth,
    } = this.props;

    // default positioning
    let mobileLeft = 190;
    let mobileBottom = 20;
    if (isEmbedModeActive) {
      mobileLeft = 145;
      mobileBottom = 20;
    }
    // positioning will change depending on a combination of:
    // 1) subdaily (mobile date picker width);
    // 2) screen width; and
    // 3) compare mode
    if (hasSubdailyLayers && screenWidth >= 484) {
      mobileLeft = 287;
      if (isEmbedModeActive) {
        mobileLeft = 220;
      }
    } else if (screenWidth < 575) {
      mobileLeft = isCompareModeActive ? 112 : 10;
      mobileBottom = 75;
      if (isEmbedModeActive) {
        mobileLeft = isCompareModeActive ? 90 : 10;
        mobileBottom = 60;
      }
    }

    return {
      left: `${mobileLeft}px`,
      bottom: `${mobileBottom}px`,
    };
  };

  renderDateChangeArrows = () => {
    const {
      isMobile, leftArrowDisabled, rightArrowDisabled, nowButtonDisabled,
    } = this.props;
    return (
      <DateChangeArrows
        leftArrowDown={() => this.handleArrowDateChange(-1)}
        leftArrowDisabled={leftArrowDisabled}
        isMobile={isMobile}
        rightArrowDown={() => this.handleArrowDateChange(1)}
        rightArrowDisabled={rightArrowDisabled}
        nowButtonDisabled={nowButtonDisabled}
        handleSelectNowButton={this.handleSelectNowButton}
      />
    );
  };

  renderMobile() {
    const {
      animationDisabled,
      hasSubdailyLayers,
      isCompareModeActive,
      isDataDownload,
      isMobile,
      isMobilePhone,
      isMobileTablet,
      isLandscape,
      isPortrait,
      breakpoints,
      screenWidth,
      selectedDate,
      timelineEndDateLimit,
      timelineStartDateLimit,
    } = this.props;

    return (
      <div id="timeline-header" className="timeline-header-mobile">
        <MobileDatePicker
          date={selectedDate}
          startDateLimit={timelineStartDateLimit}
          endDateLimit={timelineEndDateLimit}
          onDateChange={this.onDateChange}
          hasSubdailyLayers={hasSubdailyLayers}
          isMobile={isMobile}
        />
        <MobileComparisonToggle />
        <div
          className="mobile-date-change-arrows-btn"
          style={this.getMobileDateButtonStyle()}
        >
          <div id="zoom-buttons-group">
            {this.renderDateChangeArrows()}
          </div>
        </div>
        <div>
          {!isCompareModeActive && (
          <AnimationButton
            isMobile={isMobile}
            breakpoints={breakpoints}
            screenWidth={screenWidth}
            isMobilePhone={isMobilePhone}
            isMobileTablet={isMobileTablet}
            isLandscape={isLandscape}
            isPortrait={isPortrait}
            clickAnimationButton={this.clickAnimationButton}
            hasSubdailyLayers={hasSubdailyLayers}
            disabled={animationDisabled}
            label={
                    isCompareModeActive
                      ? 'Animation feature is deactivated when Compare feature is active'
                      : isDataDownload
                        ? 'Animation feature is deactivated when Data Download feature is active'
                        : ''
                  }
          />
          )}
        </div>
      </div>
    );
  }

  render() {
    const {
      activeLayers,
      animationDisabled,
      animEndLocationDate,
      animStartLocationDate,
      appNow,
      axisWidth,
      breakpoints,
      dateA,
      dateB,
      draggerSelected,
      hasFutureLayers,
      hasSubdailyLayers,
      hideTimeline,
      isAnimationPlaying,
      isAnimatingToEvent,
      isAnimationWidgetOpen,
      isCompareModeActive,
      isDataDownload,
      isDistractionFreeModeActive,
      isEmbedModeActive,
      isMobile,
      isTourActive,
      parentOffset,
      screenWidth,
      selectedDate,
      timelineCustomModalOpen,
      timelineEndDateLimit,
      timelineStartDateLimit,
      timeScale,
      timeScaleChangeUnit,
      toggleActiveCompareState,
    } = this.props;
    const {
      animationEndLocation,
      animationEndLocationDate,
      animationStartLocation,
      animationStartLocationDate,
      backDate,
      draggerPosition,
      draggerPositionB,
      draggerTimeState,
      draggerTimeStateB,
      draggerVisible,
      draggerVisibleB,
      frontDate,
      hoverLinePosition,
      hoverTime,
      initialLoadComplete,
      isAnimationDraggerDragging,
      isDraggerDragging,
      isTimelineDragging,
      isTimelineLayerCoveragePanelOpen,
      leftOffset,
      matchingTimelineCoverage,
      position,
      rangeSelectorMax,
      shouldIncludeHiddenLayers,
      showDraggerTime,
      showHoverLine,
      timelineHidden,
      transformX,
    } = this.state;
    const selectedDraggerPosition = draggerSelected === 'selected'
      ? draggerPosition
      : draggerPositionB;
    // timeline open/closed styling
    const isTimelineHidden = timelineHidden || hideTimeline;
    const chevronDirection = isTimelineHidden ? 'left' : 'right';
    const isAnimationWidgetReady = isAnimationWidgetOpen
      && !animationDisabled
      && animationStartLocation
      && animationStartLocationDate
      && animationEndLocation
      && animationEndLocationDate;

    const containerDisplayStyle = {
      display: isDistractionFreeModeActive ? 'none' : 'block',
    };

    return (
      <div
        className="timeline-container"
        style={containerDisplayStyle}
      >
        {initialLoadComplete && !isDistractionFreeModeActive
            && (
            <ErrorBoundary>
              {isMobile || isEmbedModeActive
              /* Mobile Timeline Size */
                ? this.renderMobile()
                /* Normal Timeline Size */
                : !isDistractionFreeModeActive && (
                  <section id="timeline" className="timeline-inner clearfix">
                    <div
                      id="timeline-header"
                      className={`timeline-header-desktop ${hasSubdailyLayers ? 'subdaily' : ''}`}
                      style={{ marginRight: isTimelineHidden ? '20px' : '0' }}
                    >
                      {/* Date Selector, Interval, Arrow Controls */}
                      <div id="date-selector-main">
                        <DateSelector
                          id={draggerSelected}
                          idSuffix="timeline"
                          date={new Date(selectedDate)}
                          onDateChange={this.onDateChange}
                          maxDate={new Date(timelineEndDateLimit)}
                          minDate={new Date(timelineStartDateLimit)}
                          subDailyMode={hasSubdailyLayers}
                          fontSize={24}
                        />
                      </div>
                      <div id="zoom-buttons-group">

                        <TimeScaleIntervalChange
                          timeScaleChangeUnit={timeScaleChangeUnit}
                          hasSubdailyLayers={hasSubdailyLayers}
                          modalType={customModalType.TIMELINE}
                        />

                        {this.renderDateChangeArrows()}
                      </div>
                      <AnimationButton
                        clickAnimationButton={this.clickAnimationButton}
                        disabled={animationDisabled}
                        screenWidth={screenWidth}
                        breakpoints={breakpoints}
                        label={
                        isCompareModeActive
                          ? 'Animation feature is deactivated when Compare feature is active'
                          : isDataDownload
                            ? 'Animation feature is deactivated when Data Download feature is active'
                            : ''
                      }
                      />
                    </div>

                    {!isTimelineHidden
                      && (
                      <div id="timeline-footer" className="notranslate">
                        {/* Axis */}
                        <TimelineAxis
                          appNow={appNow}
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
                          debounceChangeTimeScaleWheel={this.debounceChangeTimeScaleWheel}
                          onDateChange={this.onDateChange}
                          updatePositioning={this.updatePositioning}
                          updateTimelineMoveAndDrag={this.updateTimelineMoveAndDrag}
                          updatePositioningOnSimpleDrag={this.updatePositioningOnSimpleDrag}
                          updatePositioningOnAxisStopDrag={this.updatePositioningOnAxisStopDrag}
                          updateDraggerDatePosition={this.updateDraggerDatePosition}
                          showHoverOn={this.showHoverOn}
                          showHoverOff={this.showHoverOff}
                          showHover={this.showHover}
                          hasFutureLayers={hasFutureLayers}
                          hasSubdailyLayers={hasSubdailyLayers}
                          isCompareModeActive={isCompareModeActive}
                          isAnimationPlaying={isAnimationPlaying}
                          isAnimatingToEvent={isAnimatingToEvent}
                          isTourActive={isTourActive}
                          isAnimationDraggerDragging={isAnimationDraggerDragging}
                          isDraggerDragging={isDraggerDragging}
                          isTimelineDragging={isTimelineDragging}
                          matchingTimelineCoverage={matchingTimelineCoverage}
                        />

                        <AxisHoverLine
                          activeLayers={activeLayers}
                          shouldIncludeHiddenLayers={shouldIncludeHiddenLayers}
                          axisWidth={axisWidth}
                          hoverLinePosition={hoverLinePosition}
                          showHoverLine={showHoverLine}
                          isTimelineDragging={isTimelineDragging}
                          isAnimationDraggerDragging={isAnimationDraggerDragging}
                          isDraggerDragging={isDraggerDragging}
                          selectedDraggerPosition={selectedDraggerPosition}
                          isTimelineLayerCoveragePanelOpen={isTimelineLayerCoveragePanelOpen}
                        />

                        {/* Timeline Layer Coverage Panel */}
                        <TimelineLayerCoveragePanel
                          appNow={appNow}
                          axisWidth={axisWidth}
                          backDate={backDate}
                          frontDate={frontDate}
                          isTimelineLayerCoveragePanelOpen={isTimelineLayerCoveragePanelOpen}
                          matchingTimelineCoverage={matchingTimelineCoverage}
                          parentOffset={parentOffset}
                          positionTransformX={position + transformX}
                          setMatchingTimelineCoverage={this.setMatchingTimelineCoverage}
                          timelineStartDateLimit={timelineStartDateLimit}
                          timeScale={timeScale}
                          toggleLayerCoveragePanel={this.toggleLayerCoveragePanel}
                        />

                        {isAnimationWidgetReady
                          && (
                          <TimelineRangeSelector
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
                          />
                          )}

                        {frontDate
                          && (
                          <DraggerContainer
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
                          )}

                        {!isTimelineDragging
                          && (
                          <DateTooltip
                            activeLayers={activeLayers}
                            shouldIncludeHiddenLayers={shouldIncludeHiddenLayers}
                            axisWidth={axisWidth}
                            leftOffset={leftOffset}
                            hoverTime={hoverTime}
                            selectedDate={selectedDate}
                            selectedDraggerPosition={selectedDraggerPosition}
                            hasSubdailyLayers={hasSubdailyLayers}
                            showDraggerTime={showDraggerTime}
                            showHoverLine={showHoverLine}
                            isTimelineLayerCoveragePanelOpen={isTimelineLayerCoveragePanelOpen}
                          />
                          )}
                      </div>
                      )}

                    {/* Custom Interval Selector Widget */}
                    <CustomIntervalSelector
                      modalOpen={timelineCustomModalOpen}
                      hasSubdailyLayers={hasSubdailyLayers}
                    />

                    {/* Zoom Level Change Controls */}
                    <AxisTimeScaleChange
                      timeScale={timeScale}
                      changeTimeScale={this.changeTimeScale}
                      isDraggerDragging={isDraggerDragging}
                      hasSubdailyLayers={hasSubdailyLayers}
                      timelineHidden={isTimelineHidden}
                    />

                    {/* Open/Close Chevron */}
                    <div
                      id="timeline-hide"
                      aria-label={isTimelineHidden ? 'Show timeline' : 'Hide timeline'}
                      onClick={this.toggleHideTimeline}
                    >
                      <UncontrolledTooltip id="center-align-tooltip" target="timeline-hide" placement="top">
                        {isTimelineHidden ? 'Show timeline' : 'Hide timeline'}
                      </UncontrolledTooltip>
                      <div
                        className={`wv-timeline-hide wv-timeline-hide-double-chevron-${chevronDirection}`}
                      />
                    </div>
                  </section>
                )}
            </ErrorBoundary>
            )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  const {
    animation,
    compare,
    config,
    date,
    events,
    embed,
    layers,
    map,
    modal,
    proj,
    screenSize,
    sidebar,
    tour,
    ui,
  } = state;
  const {
    appNow,
    customDelta,
    customInterval,
    customSelected,
    interval,
    selected,
    selectedB,
    selectedZoom,
    timelineCustomModalOpen,
  } = date;
  const { isCompareA } = compare;
  const isCompareModeActive = compare.active;
  const { isDistractionFreeModeActive } = ui;
  const { isEmbedModeActive } = embed;
  const isMobile = screenSize.isMobileDevice;
  const {
    breakpoints,
    screenWidth,
    isMobilePhone,
    isMobileTablet,
    orientation,
  } = screenSize;
  const { isAnimatingToEvent } = events;

  // handle active layer filtering and check for subdaily
  const activeLayers = getActiveLayers(state);
  const projection = proj.id;
  const activeLayersFiltered = filterProjLayersWithStartDate(activeLayers, projection);
  const hasSubdailyLayers = isCompareModeActive
    ? hasSubDaily(layers.active.layers) || hasSubDaily(layers.activeB.layers)
    : subdailyLayersActive(state);


  // if future layers are included, timeline axis end date will extend past appNow
  const hasFutureLayers = checkHasFutureLayers(state);
  let timelineEndDateLimit;
  if (hasFutureLayers) {
    timelineEndDateLimit = getTimelineEndDateLimit(state);
  } else {
    timelineEndDateLimit = getISODateFormatted(appNow);
  }

  const selectedDate = getSelectedDate(state);
  const { delta, unit } = getDeltaIntervalUnit(state);

  let updatedCustomInterval = customInterval;
  let updatedSelectedZoom = selectedZoom;

  // handle reset of timescale and intervals if not subdaily
  if (!hasSubdailyLayers) {
    if (selectedZoom > 3) {
      updatedSelectedZoom = 3;
    }
    if (customInterval > 3) {
      updatedCustomInterval = 3;
    }
  }

  const nowOverride = !!config.parameters.now;
  const dimensionsAndOffsetValues = getOffsetValues(
    screenWidth,
    hasSubdailyLayers,
  );

  const timelineStartDateLimit = config.startDate;
  const leftArrowDisabled = checkLeftArrowDisabled(
    selectedDate,
    delta,
    unit,
    timelineStartDateLimit,
  );
  const rightArrowDisabled = checkRightArrowDisabled(
    selectedDate,
    delta,
    unit,
    timelineEndDateLimit,
  );
  const nowButtonDisabled = checkNowButtonDisabled(
    selectedDate,
    timelineEndDateLimit,
    hasFutureLayers,
    nowOverride,
    appNow,
  );
  return {
    appNow,
    activeLayers: activeLayersFiltered,
    isTourActive: tour.active,
    isMobile,
    isMobilePhone,
    isMobileTablet,
    orientation,
    isLandscape: screenSize.orientation === 'landscape',
    isPortrait: screenSize.orientation === 'portrait',
    screenWidth,
    breakpoints,
    draggerSelected: isCompareA ? 'selected' : 'selectedB',
    hasSubdailyLayers,
    customSelected,
    isCompareModeActive,
    isAnimatingToEvent,
    hasFutureLayers,
    dateA: getISODateFormatted(selected),
    dateB: getISODateFormatted(selectedB),
    timelineStartDateLimit: config.startDate, // same as startDate
    isAnimationWidgetOpen: animation.isActive,
    animStartLocationDate: animation.startDate,
    animEndLocationDate: animation.endDate,
    axisWidth: dimensionsAndOffsetValues.width,
    selectedDate,
    timeScale: TIME_SCALE_FROM_NUMBER[updatedSelectedZoom.toString()],
    timeScaleChangeUnit: unit,
    customInterval: customInterval || interval,
    interval,
    customIntervalValue: customDelta || 1,
    customIntervalZoomLevel: updatedCustomInterval || 3,
    nowOverride,
    deltaChangeAmt: delta,
    parentOffset: dimensionsAndOffsetValues.parentOffset,
    timelineEndDateLimit,
    leftArrowDisabled,
    rightArrowDisabled,
    nowButtonDisabled,
    hideTimeline:
      (modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT') || animation.gifActive,
    animationDisabled:
      !lodashGet(map, 'ui.selected.frameState_')
      || sidebar.activeTab === 'download'
      || compare.active,
    isDataDownload: sidebar.activeTab === 'download',
    isAnimationPlaying: animation.isPlaying,
    isAnimationCollapsed: animation.isCollapsed,
    isGifActive: animation.gifActive,
    timelineCustomModalOpen,
    isDistractionFreeModeActive,
    isEmbedModeActive,
  };
}

const mapDispatchToProps = (dispatch) => ({
  // updates the relative application now to allow up to date coverage
  updateAppNow: (date) => {
    dispatch(updateAppNow(date));
  },
  // sets date to NOW based on state.date.appNow
  triggerTodayButton: () => {
    dispatch(triggerTodayButton());
  },
  // changes date of active dragger 'selected' or 'selectedB'
  selectDate: (val) => {
    dispatch(selectDateAction(val));
  },
  // changes/sets custom delta and timescale interval
  changeCustomInterval: (delta, timeScale) => {
    dispatch(changeCustomIntervalAction(delta, timeScale));
  },
  // changes timescale (scale of grids vs. what LEFT/RIGHT arrow do)
  changeTimeScale: (val) => {
    dispatch(changeTimeScale(val));
  },
  // changes to non-custom timescale interval, sets customSelected to TRUE/FALSE
  selectInterval: (delta, timeScale, customSelected) => {
    dispatch(selectInterval(delta, timeScale, customSelected));
  },
  toggleCustomModal: (open, toggleBy) => {
    dispatch(toggleCustomModal(open, toggleBy));
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
  onUpdateStartDate: (date) => {
    dispatch(changeStartDate(date));
  },
  // update animation endDate
  onUpdateEndDate: (date) => {
    dispatch(changeEndDate(date));
  },
  // update animation startDate and endDate
  onUpdateStartAndEndDate: (startDate, endDate) => {
    dispatch(changeStartAndEndDate(startDate, endDate));
  },
  // unminimize animation widget in mobile
  onToggleAnimationCollapse: () => {
    dispatch(toggleAnimationCollapse());
  },
  onPauseAnimation: () => {
    dispatch(pauseAnimation());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Timeline);

Timeline.propTypes = {
  appNow: PropTypes.object,
  activeLayers: PropTypes.array,
  animationDisabled: PropTypes.bool,
  animEndLocationDate: PropTypes.object,
  animStartLocationDate: PropTypes.object,
  axisWidth: PropTypes.number,
  breakpoints: PropTypes.object,
  changeCustomInterval: PropTypes.func,
  changeTimeScale: PropTypes.func,
  closeAnimation: PropTypes.func,
  customInterval: PropTypes.number,
  customSelected: PropTypes.bool,
  dateA: PropTypes.string,
  dateB: PropTypes.string,
  deltaChangeAmt: PropTypes.number,
  draggerSelected: PropTypes.string,
  hasFutureLayers: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  hideTimeline: PropTypes.bool,
  interval: PropTypes.number,
  isAnimationPlaying: PropTypes.bool,
  isAnimatingToEvent: PropTypes.bool,
  isAnimationWidgetOpen: PropTypes.bool,
  isCompareModeActive: PropTypes.bool,
  isDataDownload: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isGifActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  isMobilePhone: PropTypes.bool,
  isMobileTablet: PropTypes.bool,
  isLandscape: PropTypes.bool,
  isPortrait: PropTypes.bool,
  isTourActive: PropTypes.bool,
  leftArrowDisabled: PropTypes.bool,
  nowButtonDisabled: PropTypes.bool,
  nowOverride: PropTypes.bool,
  onPauseAnimation: PropTypes.func,
  onToggleAnimationCollapse: PropTypes.func,
  onUpdateEndDate: PropTypes.func,
  onUpdateStartAndEndDate: PropTypes.func,
  onUpdateStartDate: PropTypes.func,
  openAnimation: PropTypes.func,
  parentOffset: PropTypes.number,
  rightArrowDisabled: PropTypes.bool,
  screenWidth: PropTypes.number,
  selectDate: PropTypes.func,
  selectedDate: PropTypes.object,
  timelineCustomModalOpen: PropTypes.bool,
  timelineEndDateLimit: PropTypes.string,
  timelineStartDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  timeScaleChangeUnit: PropTypes.string,
  toggleActiveCompareState: PropTypes.func,
  toggleCustomModal: PropTypes.func,
  triggerTodayButton: PropTypes.func,
  updateAppNow: PropTypes.func,
};

// get axisWidth and parentOffset for axis, footer, and leftOffset calculations
const getOffsetValues = (innerWidth, hasSubDaily) => {
  const parentOffset = (hasSubDaily ? 414 : 310) + 10;
  const width = innerWidth - parentOffset - 88;
  return { width, parentOffset };
};

// check if left arrow should be disabled on predicted decrement
const checkLeftArrowDisabled = (
  date,
  delta,
  timeScaleChangeUnit,
  timelineStartDateLimit,
) => {
  const nextDecMoment = moment.utc(date).subtract(delta, timeScaleChangeUnit);
  const nextDecrementDate = new Date(nextDecMoment.seconds(0).format());
  const minMinusDeltaMoment = moment.utc(timelineStartDateLimit).subtract(delta, timeScaleChangeUnit);
  const minMinusDeltaDate = new Date(minMinusDeltaMoment.seconds(0).format());

  const nextDecrementDateTime = nextDecrementDate.getTime();
  const minMinusDeltaDateTime = minMinusDeltaDate.getTime();
  return nextDecrementDateTime <= minMinusDeltaDateTime;
};

// check if right arrow should be disabled on predicted increment
const checkRightArrowDisabled = (
  date,
  delta,
  timeScaleChangeUnit,
  timelineEndDateLimit,
) => {
  const nextIncMoment = moment.utc(date).add(delta, timeScaleChangeUnit);
  const nextIncrementDate = new Date(nextIncMoment.seconds(0).format());

  const nextIncrementDateTime = nextIncrementDate.getTime();
  const maxPlusDeltaDateTime = new Date(timelineEndDateLimit).getTime();
  return nextIncrementDateTime > maxPlusDeltaDateTime;
};

const checkNowButtonDisabled = (
  date,
  timelineEndDateLimit,
  hasFutureLayers,
  nowOverride,
  appNow,
) => {
  const dateTimeMoment = new Date(moment.utc(date).seconds(0).format());
  let maxDateMoment;
  if (nowOverride || hasFutureLayers) {
    maxDateMoment = new Date(moment.utc(appNow).seconds(0).format());
  } else {
    maxDateMoment = new Date(moment.utc(timelineEndDateLimit).seconds(0).format());
  }
  return dateTimeMoment.getTime() === maxDateMoment.getTime();
};

// get timelineEndDateLimit based on potential future layers
const getTimelineEndDateLimit = (state) => {
  const {
    date, layers, compare, proj,
  } = state;
  const { appNow } = date;
  const activeLayers = getActiveLayers(state);

  let layerDateRange;
  if (compare.active) {
    // use all layers to keep timeline axis range consistent when switching between A/B
    const compareALayersFiltered = filterProjLayersWithStartDate(layers.active.layers, proj.id);
    const compareBLayersFiltered = filterProjLayersWithStartDate(layers.activeB.layers, proj.id);
    layerDateRange = getDateRange({}, [...compareALayersFiltered, ...compareBLayersFiltered]);
  } else {
    const activeLayersFiltered = filterProjLayersWithStartDate(activeLayers, proj.id);
    layerDateRange = getDateRange({}, activeLayersFiltered);
  }

  let timelineEndDateLimit;
  if (layerDateRange && layerDateRange.end > appNow) {
    const layerDateRangeEndRoundedQuarterHour = util.roundTimeQuarterHour(layerDateRange.end);
    const appNowRoundedQuarterHour = util.roundTimeQuarterHour(appNow);
    if (layerDateRangeEndRoundedQuarterHour.getTime() > appNowRoundedQuarterHour.getTime()) {
      // if layerDateRange.end is after the set rounded quarter hour time, then update
      timelineEndDateLimit = getISODateFormatted(layerDateRangeEndRoundedQuarterHour);
    }
  } else {
    timelineEndDateLimit = getISODateFormatted(appNow);
  }
  return timelineEndDateLimit;
};
