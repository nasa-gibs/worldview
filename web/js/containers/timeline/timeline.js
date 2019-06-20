import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import util from '../../util/util';

import ErrorBoundary from '../../containers/error-boundary';
import MobileDatePicker from '../../components/timeline/mobile-date-picker';

import TimelineAxis from '../../components/timeline/timeline-axis/timeline-axis';
import TimeScaleIntervalChange from '../../components/timeline/timeline-controls/interval-timescale-change';
import DraggerContainer from '../../components/timeline/timeline-axis/dragger-container';
import HoverLine from '../../components/timeline/timeline-axis/hover-line';
import DateToolTip from '../../components/timeline/timeline-axis/date-tooltips';
import CustomIntervalSelectorWidget from '../../components/timeline/interval-selector/interval-selector';

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
  getPosition,
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
      initialLoadComplete: false,
      timelineHidden: false,
      customIntervalModalOpen: false,
      position: 0,
      transformX: 0,
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
      moved: false,
      hoverTime: '',
      hoverLinePosition: 0,
      showHoverLine: false,
      showDraggerTime: false,
      isDraggerDragging: false,
      leftOffset: 0,
      isAnimationDraggerDragging: false,
      isTimelineDragging: false,
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
  * @param {Boolean} moved
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
  * @returns {void}
  */
  updatePositioning = ({
    moved,
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
      moved,
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
  * @desc handle left/right arrow decrement/increment date
  * @param {Number} signconstant - used to determine if decrement(-1) or increment(1)
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
    if (e.keyCode === 37) {
      e.preventDefault();
      this.throttleDecrementDate();
    } else if (e.keyCode === 39) {
      e.preventDefault();
      this.throttleIncrementDate();
    }
  };
  /**
  * @desc handles stopping change date in process and to allow faster key downs
  * @param {Event} mouse event
  * @returns {void}
  */
  handleKeyUp = (e) => {
    if (e.keyCode === 37) {
      e.preventDefault();
      this.stopLeftArrow();
    } else if (e.keyCode === 39) {
      e.preventDefault();
      this.stopRightArrow();
    }
  };

  /**
  * @desc show/hide custom interval modal
  * @returns {void}
  */
  toggleCustomIntervalModal = () => {
    this.setState(prevState => ({
      customIntervalModalOpen: !prevState.customIntervalModalOpen
    }));
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
    this.setState({
      customIntervalModalOpen: modalOpen
    });
  };

  /**
  * @desc open animation wdiget
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
  * @desc handle animation dragger location update and state update
  * @param {String} startDate
  * @param {String} endDate
  * @returns {void}
  */
  animationDraggerDateUpdate = (startDate, endDate) => {
    let { position, transformX } = this.state;
    let { timeScale } = this.props;

    let options = timeScaleOptions[timeScale].timeAxis;
    let gridWidth = options.gridWidth;

    let frontDate = moment.utc(this.state.frontDate);
    let startLocation = frontDate.diff(startDate, timeScale, true) * gridWidth;
    let endLocation = frontDate.diff(endDate, timeScale, true) * gridWidth;

    this.setState({
      animationStartLocation: position - startLocation + transformX,
      animationEndLocation: position - endLocation + transformX,
      animationStartLocationDate: startDate,
      animationEndLocationDate: endDate
    });
    this.debounceOnUpdateStartAndEndDate(startDate, endDate);
  }

  // DRAGGER
  /**
  * @desc update state dragger position and if new date, change store date
  * @param {String} newDate - new dragger date
  * @param {String} draggerSelected
  * @param {Number} draggerPosition
  * @param {Boolean} draggerVisible
  * @param {Boolean} otherDraggerVisible
  * @param {Boolean} moved
  * @returns {void}
  */
  updateDraggerDatePosition = (newDate, draggerSelected, draggerPosition, draggerVisible, otherDraggerVisible, moved) => {
    if (draggerSelected === 'selected') {
      this.setState({
        draggerPosition: draggerPosition || this.state.draggerPosition,
        draggerVisible: draggerVisible || this.state.draggerVisible,
        draggerVisibleB: otherDraggerVisible || this.state.draggerVisibleB,
        draggerTimeState: newDate || this.state.draggerTimeState,
        moved: moved || this.state.moved
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
        moved: moved || this.state.moved
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

  componentDidUpdate(prevProps, prevState) {
    let prevStartLocationDate = prevProps.animStartLocationDate;
    let prevEndLocationDate = prevProps.animEndLocationDate;

    let {
      animStartLocationDate,
      animEndLocationDate,
      dateA,
      dateB,
      isAnimationWidgetOpen,
      customSelected,
      customIntervalValue,
      customIntervalZoomLevel
    } = this.props;

    // handle location update triggered from animation start/end date change from animation widget
    if (isAnimationWidgetOpen) {
      if (prevStartLocationDate && prevEndLocationDate) {
        if (prevStartLocationDate.getTime() !== animStartLocationDate.getTime() ||
            prevEndLocationDate.getTime() !== animEndLocationDate.getTime() ||
            prevState.frontDate !== this.state.frontDate) {
          this.animationDraggerDateUpdate(animStartLocationDate, animEndLocationDate);
        }
      }

      // handle open/close custom interval panel if 'custom' selected in animation widget
      // and no custom value has been initialized
      if (customIntervalValue === 1 && customIntervalZoomLevel === 3) {
        if (!prevProps.customSelected && customSelected) {
          this.setState({
            customIntervalModalOpen: true
          });
        }
        if (prevProps.customSelected && !customSelected) {
          this.setState({
            customIntervalModalOpen: false
          });
        }
      }
    }

    // handle draggerTimeState updates if date changes
    if (dateA !== prevProps.dateA && dateA !== this.state.draggerTimeState) {
      this.setState({
        draggerTimeState: dateA
      });
    }
    if (dateB !== prevProps.dateB && dateB !== this.state.draggerTimeStateB) {
      this.setState({
        draggerTimeStateB: dateB
      });
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    // update application relative every 10 minutes from component mount
    this.appNowUpdateInterval = setInterval(() => this.props.updateAppNow(new Date()), 600000);
    this.setInitialState();
  }

  componentWillUnmount() {
    clearInterval(this.appNowUpdateInterval);
  }

  setInitialState = () => {
    this.setState({
      animationStartLocationDate: this.props.animStartLocationDate,
      animationEndLocationDate: this.props.animEndLocationDate,
      draggerTimeState: this.props.dateA,
      draggerTimeStateB: this.props.dateB,
      hoverTime: this.props.dateA,
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
      compareModeActive,
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
      parentOffset
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
      moved
    } = this.state;
    let selectedDate = draggerSelected === 'selected' ? draggerTimeState : draggerTimeStateB;
    return initialLoadComplete ? (
      <ErrorBoundary>
        {isSmallScreen
          ? <MobileDatePicker
            date={selectedDate}
            startDateLimit={timelineStartDateLimit}
            endDateLimit={timelineEndDateLimit}
            hasSubdailyLayers={hasSubdailyLayers}
            onDateChange={this.onDateChange}
          />
          : <section id="timeline" className="timeline-inner clearfix">
            <div id="timeline-header"
              className={hasSubdailyLayers ? 'subdaily' : ''}
            >
              <div id="date-selector-main">
                <DateSelector
                  onDateChange={this.onDateChange}
                  date={new Date(selectedDate)}
                  hasSubdailyLayers={hasSubdailyLayers}
                  draggerSelected={draggerSelected}
                  maxDate={new Date(timelineEndDateLimit)}
                  minDate={new Date(timelineStartDateLimit)}
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
                disabled={animationDisabled}
                clickAnimationButton={this.clickAnimationButton}
              />
            </div>
            <div id="timeline-footer"
              style={{
                display:
                  timelineHidden || hideTimeline ? 'none' : 'block'
              }}
            >
              {/* Axis */}
              <TimelineAxis
                frontDate={frontDate}
                backDate={backDate}
                isTimelineDragging={isTimelineDragging}
                moved={moved}
                axisWidth={axisWidth}
                dateA={dateA}
                dateB={dateB}
                hasSubdailyLayers={hasSubdailyLayers}
                changeTimeScale={this.changeTimeScale}
                compareModeActive={compareModeActive}
                draggerSelected={draggerSelected}
                onChangeSelectedDragger={toggleActiveCompareState}
                timelineStartDateLimit={timelineStartDateLimit}
                timelineEndDateLimit={timelineEndDateLimit}
                animStartLocationDate={animStartLocationDate}
                animEndLocationDate={animEndLocationDate}
                isAnimationDraggerDragging={isAnimationDraggerDragging}
                updateDraggerDatePosition={this.updateDraggerDatePosition}
                draggerTimeState={draggerTimeState}
                draggerTimeStateB={draggerTimeStateB}
                draggerPosition={draggerPosition}
                draggerPositionB={draggerPositionB}
                draggerVisible={draggerVisible}
                draggerVisibleB={draggerVisibleB}
                transformX={transformX}
                updatePositioning={this.updatePositioning}
                position={position}
                animationStartLocation={animationStartLocation}
                animationEndLocation={animationEndLocation}
                timeScale={timeScale}
                showHoverOn={this.showHoverOn}
                showHoverOff={this.showHoverOff}
                showHover={this.showHover}
                leftOffset={leftOffset}
                hoverTime={hoverTime}
                isDraggerDragging={isDraggerDragging}
                parentOffset={parentOffset}
              />

              <HoverLine
                width={axisWidth}
                isTimelineDragging={isTimelineDragging}
                isAnimationDraggerDragging={isAnimationDraggerDragging}
                showHoverLine={showHoverLine}
                hoverLinePosition={hoverLinePosition}
              />

              {isAnimationWidgetOpen
                ? <TimelineRangeSelector
                  position={position}
                  frontDate={frontDate}
                  isAnimationDraggerDragging={isAnimationDraggerDragging}
                  timeScale={timeScale}
                  startLocation={animationStartLocation}
                  endLocation={animationEndLocation}
                  startLocationDate={animationStartLocationDate}
                  endLocationDate={animationEndLocationDate}
                  timelineStartDateLimit={timelineStartDateLimit}
                  timelineEndDateLimit={timelineEndDateLimit}
                  updateAnimationDateAndLocation={this.updateAnimationDateAndLocation}
                  animationDraggerDateUpdate={this.animationDraggerDateUpdate}
                  max={rangeSelectorMax}
                  pinWidth={5}
                  width={axisWidth}
                  transformX={transformX}
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
                  position={position}
                  timelineStartDateLimit={timelineStartDateLimit}
                  timelineEndDateLimit={timelineEndDateLimit}
                  timeScale={timeScale}
                  frontDate={frontDate}
                  backDate={backDate}
                  draggerSelected={draggerSelected}
                  transformX={transformX}
                  width={axisWidth}
                  setDraggerVisibility={this.setDraggerVisibility}
                  toggleShowDraggerTime={this.toggleShowDraggerTime}
                  onChangeSelectedDragger={toggleActiveCompareState}
                  updateDraggerDatePosition={this.updateDraggerDatePosition}
                  compareModeActive={compareModeActive}
                  draggerTimeState={draggerTimeState}
                  draggerTimeStateB={draggerTimeStateB}
                  draggerPosition={draggerPosition}
                  draggerPositionB={draggerPositionB}
                  draggerVisible={draggerVisible}
                  draggerVisibleB={draggerVisibleB}
                  isDraggerDragging={isDraggerDragging}
                />
                : null }

              {!isTimelineDragging
                ? <DateToolTip
                  draggerSelected={draggerSelected}
                  draggerPosition={draggerPosition}
                  draggerPositionB={draggerPositionB}
                  hasSubdailyLayers={hasSubdailyLayers}
                  leftOffset={leftOffset}
                  showDraggerTime={showDraggerTime}
                  draggerTimeState={draggerTimeState}
                  draggerTimeStateB={draggerTimeStateB}
                  hoverTime={hoverTime}
                  showHoverLine={showHoverLine}
                  axisWidth={axisWidth}
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
              isDraggerDragging={isDraggerDragging}
              timelineHidden={timelineHidden}
              timeScale={timeScale}
              changeTimeScale={this.changeTimeScale}
              hasSubdailyLayers={hasSubdailyLayers}
            />

            {/* 🍔 Open/Close Chevron 🍔 */}
            <div id="timeline-hide" onClick={this.toggleHideTimeline}>
              <div
                className={`wv-timeline-hide wv-timeline-hide-double-chevron-${
                  timelineHidden ? 'left' : 'right'
                }`}
              />
            </div>
          </section>
        }
      </ErrorBoundary>
    ) : null;
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
    modal
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
  const compareModeActive = compare.active;
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
  if (compareModeActive) {
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
    isSmallScreen,
    draggerSelected: isCompareA ? 'selected' : 'selectedB', // ! will work for dragger?
    hasSubdailyLayers,
    customSelected,
    compareModeActive,
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
      sidebar.activeTab === 'download'
  };
}

const mapDispatchToProps = dispatch => ({
  getPosition: val => {
    dispatch(getPosition(val));
  },
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
  // update anim startDate
  onUpdateStartDate: date => {
    dispatch(changeStartDate(date));
  },
  // update anim endDate
  onUpdateEndDate: date => {
    dispatch(changeEndDate(date));
  },
  // update anim startDate and endDate
  onUpdateStartAndEndDate: (startDate, endDate) => {
    dispatch(changeStartAndEndDate(startDate, endDate));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Timeline);

Timeline.propTypes = {
  screenWidth: PropTypes.number,
  screenHeight: PropTypes.number,
  draggerSelected: PropTypes.string,
  hasSubdailyLayers: PropTypes.bool,
  customSelected: PropTypes.bool,
  compareModeActive: PropTypes.bool,
  dateA: PropTypes.string,
  dateB: PropTypes.string,
  startDate: PropTypes.string,
  timelineStartDateLimit: PropTypes.string,
  endTime: PropTypes.object,
  isAnimationWidgetOpen: PropTypes.bool,
  animStartLocationDate: PropTypes.object,
  animEndLocationDate: PropTypes.object,
  axisWidth: PropTypes.number,
  selectedDate: PropTypes.object,
  timeScale: PropTypes.string,
  timeScaleChangeUnit: PropTypes.string,
  customIntervalValue: PropTypes.number,
  customIntervalZoomLevel: PropTypes.number,
  deltaChangeAmt: PropTypes.number,
  parentOffset: PropTypes.number,
  timelineEndDateLimit: PropTypes.string,
  leftArrowDisabled: PropTypes.bool,
  rightArrowDisabled: PropTypes.bool,
  animationDisabled: PropTypes.bool,
  hideTimeline: PropTypes.bool,
  isSmallScreen: PropTypes.bool,
  toggleActiveCompareState: PropTypes.func,
  changeDate: PropTypes.func
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
 *                  e.g. months,minutes, years, days
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
  let isSameOrBefore = new Date(nextDecrementDate) <= new Date(timelineStartDateLimit);
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
  let isSameOrAfter = new Date(nextIncrementDate) >= new Date(timelineEndDateLimit);
  return isSameOrAfter;
};
