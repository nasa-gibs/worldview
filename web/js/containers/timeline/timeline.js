import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import ErrorBoundary from '../../containers/error-boundary';
import TimeScaleIntervalChange from '../../components/timeline/timeline-controls/interval-timescale-change';
import '../../components/timeline/timeline.css';
import TimelineAxis from '../../components/timeline/timeline-axis/timeline-axis';
import TimelineRangeSelector from '../../components/range-selection/range-selection';
import DraggerContainer from '../../components/timeline/timeline-axis/dragger-container';
import HoverLine from '../../components/timeline/timeline-axis/hover-line';
import DateToolTip from '../../components/timeline/timeline-axis/date-tooltips';
import CustomIntervalSelectorWidget from '../../components/timeline/interval-selector/interval-selector';
import util from '../../util/util';
import DateSelector from '../../components/date-selector/date-selector';
import DateChangeArrows from '../../components/timeline/timeline-controls/date-change-arrows';

import AnimationButton from '../../components/timeline/timeline-controls/animation-button';
import AxisTimeScaleChange from '../../components/timeline/timeline-controls/axis-timescale-change';

import { debounce as lodashDebounce, get as lodashGet } from 'lodash';
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
  changeCustomInterval
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

const MARGIN = {
  top: 0,
  right: 50,
  bottom: 20,
  left: 30
};

class Timeline extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initialLoadComplete: false,
      timelineHidden: false,
      customIntervalModalOpen: false,
      animationInProcess: false,
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
    this.animator = 0;
    this.debounceDateUpdate = lodashDebounce(this.props.changeDate, 50);

    // animation dragger updates
    this.debounceOnUpdateStartDate = lodashDebounce(this.props.onUpdateStartDate, 30);
    this.debounceOnUpdateEndDate = lodashDebounce(this.props.onUpdateEndDate, 30);
    this.debounceOnUpdateStartAndEndDate = lodashDebounce(this.props.onUpdateStartAndEndDate, 30);
  }

  // ! HOVER TIME
  // display date based on hover grid tile
  displayDate = (date, leftOffset) => {
    requestAnimationFrame(() => {
      this.setState({
        hoverTime: date,
        leftOffset: leftOffset - this.props.parentOffset // relative location from parent bounding box of mouse hover position (i.e. BLUE LINE)
      });
    });
  }

  // show hover line
  showHoverOn = (e) => {
    if (!this.state.isAnimationDraggerDragging && !this.state.showDraggerTime && !this.state.isTimelineDragging) {
      if (e.target.className.animVal === 'grid') {
        if (this.state.showHoverLine !== true) {
          this.setState({
            showHoverLine: true
          });
        }
      }
    }
  }

  // hide hover line
  showHoverOff = () => {
    if (this.state.showHoverLine === true) {
      this.setState({
        showHoverLine: false
      });
    }
  }

  // toggle dragger time on/off
  toggleShowDraggerTime = (toggleBoolean) => {
    this.setState({
      showDraggerTime: toggleBoolean,
      showHoverLine: false,
      isDraggerDragging: toggleBoolean
    });
  }

  // handle svg blue line hover
  showHover = (e, itemDate, nextDate, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.persist();
    requestAnimationFrame(() => {
      let {
        position,
        transformX
      } = this.state;
      let { timeScale } = this.props;

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

      let isBetweenValidTimeline = getIsBetween(displayDateValue, this.props.timelineStartDateLimit, this.props.timelineEndDateLimit);
      if (isBetweenValidTimeline) {
        let displayDateFormat = getISODateFormatted(displayDateValue);
        this.displayDate(displayDateFormat, clientX);
        this.setState({
          hoverLinePosition: index * gridWidth + xHoverPositionInCurrentGrid + transformX + position
        });
      }
    });
  }

  // handles dynamic position changes from axis that affect dragger and range select
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
  }) => {
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
      animationEndLocation
    });
  }
<<<<<<< HEAD
=======

>>>>>>> fix anim date inputs, continue large refactor and clean up
  /**
   *  Clear animateByIncrement's Timeout
   *
   * @return {void}
   */
  stopper = () => {
    clearInterval(this.animator);
    this.animator = 0;
    this.setState({
      animationInProcess: false
    });
  };
  /**
   * Add timeout to date change when buttons are being held so that
   * date changes don't happen too quickly
   *
   * @todo Create smart precaching so animation is smooth
   *
   * @param  {number} delta Amount of time to change
   * @param  {String} increment Zoom level of timeline
   *                  e.g. months,minutes, years, days
   * @return {void}
   */
  animateByIncrement = (delta, increment) => {
    const {
      endTime,
      startDate
    } = this.props;

    let animate = () => {
      var nextTime = getNextTimeSelection(delta, increment, this.props.selectedDate);
      if (new Date(startDate) <= nextTime && nextTime <= endTime) {
        this.changeDate(util.dateAdd(this.props.selectedDate, increment, delta));
      }
      if (this.state.animationInProcess) {
        this.animator = setInterval(() => animate, ANIMATION_DELAY);
      }
    };
    this.setState({
      animationInProcess: true
    });
    animate();
  };

  // show/hide custom interval modal
  toggleCustomIntervalModal = () => {
    this.setState(prevState => ({
      customIntervalModalOpen: !prevState.customIntervalModalOpen
    }));
  };

  // Change the timescale parent state
  changeTimeScale = timeScaleNumber => {
    this.props.changeTimeScale(timeScaleNumber);
  };

  // handle SET of custom time scale panel
  changeCustomInterval = (delta, timeScale) => {
    this.props.changeCustomInterval(Number(delta), Number(timeScale));
  };

  // handle SELECT of LEFT/RIGHT interval selection
  setTimeScaleIntervalChangeUnit = (
    intervalSelected,
    customIntervalModalOpen
  ) => {
    let delta;
    let {
      customIntervalZoomLevel,
      customIntervalValue,
      selectInterval
    } = this.props;
    let customSelected = intervalSelected === 'custom';
    if (customSelected && customIntervalZoomLevel && customIntervalValue) {
      intervalSelected = customIntervalZoomLevel;
      delta = customIntervalValue;
    } else {
      intervalSelected = Number(timeScaleToNumberKey[intervalSelected]);
      delta = 1;
    }
    selectInterval(delta, intervalSelected, customSelected);
    this.setState({
      customIntervalModalOpen: !!customIntervalModalOpen
    });
  };

  // right arrow increment date
  incrementDate = () => {
    let delta = this.props.customSelected ? this.props.intervalChangeAmt : 1;
    this.animateByIncrement(Number(delta), this.props.timeScaleChangeUnit);
  };

  // left arrow decrement date
  decrementDate = () => {
    let delta = this.props.customSelected ? this.props.intervalChangeAmt : 1;
    this.animateByIncrement(Number(delta * -1), this.props.timeScaleChangeUnit);
  };

  // open animation dialog
  clickAnimationButton = () => {
    if (this.props.isAnimationWidgetOpen) {
      this.props.closeAnimation();
    } else {
      this.props.openAnimation();
    }
    // Will be a setState({})
    // a deriveStateFromProps will be wanted with this one
  };

  // toggle hide timeline
  toggleHideTimeline = () => {
    this.setState({
      timelineHidden: !this.state.timelineHidden
    });
  };

  // toggle selected dragger for comparison mode/focused date used in date selector
  onChangeSelectedDragger = () => {
    this.props.toggleActiveCompareState();
  };

  // handles left/right arrow down to decrement/increment date
  handleKeyDown = lodashDebounce(
    e => {
      if (e.keyCode === 37) {
        this.decrementDate();
        e.preventDefault();
      } else if (e.keyCode === 39) {
        this.incrementDate();
        e.preventDefault();
      }
    },
    0,
    { leading: true, trailing: false }
  );

  // handles stopping change date in process and to allow faster key downs
  handleKeyUp = e => {
    if (e.keyCode === 37 || e.keyCode === 39) {
      this.stopper();
      e.preventDefault();
    }
  };

  // handle animation date updates
  updateAnimationDateAndLocation = (animationStartLocationDate, animationEndLocationDate, animationStartLocation, animationEndLocation, isDragging) => {
    this.setState({
      animationStartLocation: animationStartLocation || this.state.animationStartLocation,
      animationEndLocation: animationEndLocation || this.state.animationEndLocation,
      animationStartLocationDate: animationStartLocationDate,
      animationEndLocationDate: animationEndLocationDate,
      isAnimationDraggerDragging: isDragging
    });
    this.determineAnimationDraggerUpdate(animationStartLocationDate, animationEndLocationDate);
  }

  determineAnimationDraggerUpdate = (animationStartLocationDate, animationEndLocationDate) => {
    let startChanged = this.props.animationStartLocationDate !== animationStartLocationDate;
    let endChanged = this.props.animationEndLocationDate !== animationEndLocationDate;
    if (startChanged) {
      if (endChanged) {
        this.debounceOnUpdateStartAndEndDate(animationStartLocationDate, animationEndLocationDate);
      } else {
        this.debounceOnUpdateStartDate(animationStartLocationDate);
      }
    } else {
      if (endChanged) {
        this.debounceOnUpdateEndDate(animationEndLocationDate);
      }
    }
  }

  // handle animation dragger location update and state update
  animationDraggerDateUpdate = (animationStartLocationDate, animationEndLocationDate) => {
    let { position, transformX } = this.state;
    let { timeScale } = this.props;

    let options = timeScaleOptions[timeScale].timeAxis;
    let gridWidth = options.gridWidth;

    let frontDate = moment.utc(this.state.frontDate);
    let startLocation = frontDate.diff(animationStartLocationDate, timeScale, true) * gridWidth;
    let endLocation = frontDate.diff(animationEndLocationDate, timeScale, true) * gridWidth;
    this.setState({
      animationStartLocation: position - startLocation + transformX,
      animationEndLocation: position - endLocation + transformX,
      animationStartLocationDate: animationStartLocationDate,
      animationEndLocationDate: animationEndLocationDate
    });
    this.debounceOnUpdateStartAndEndDate(animationStartLocationDate, animationEndLocationDate);
  }

  // ! DRAGGER
  updateDraggerDatePosition = (newDraggerDate, draggerSelected, draggerPosition, draggerVisible, otherDraggerVisible, moved) => {
    if (draggerSelected === 'selected') {
      this.setState({
        draggerPosition: draggerPosition || this.state.draggerPosition,
        draggerVisible: draggerVisible || this.state.draggerVisible,
        draggerVisibleB: otherDraggerVisible || this.state.draggerVisibleB,
        draggerTimeState: newDraggerDate || this.state.draggerTimeState,
        moved: moved || this.state.moved
      });
      if (newDraggerDate) {
        this.changeDate(newDraggerDate, 'selected');
      }
    } else {
      this.setState({
        draggerPositionB: draggerPosition || this.state.draggerPositionB,
        draggerVisible: otherDraggerVisible || this.state.draggerVisible,
        draggerVisibleB: draggerVisible || this.state.draggerVisibleB,
        draggerTimeStateB: newDraggerDate || this.state.draggerTimeStateB,
        moved: moved || this.state.moved
      });
      if (newDraggerDate) {
        this.changeDate(newDraggerDate, 'selectedB');
      }
    }
  }

  setDraggerVisibility = (draggerVisible, draggerVisibleB) => {
    this.setState({
      draggerVisible,
      draggerVisibleB
    });
  }

  componentDidUpdate(prevProps) {
    let prevStartLocationDate = prevProps.animStartLocationDate;
    let prevEndLocationDate = prevProps.animEndLocationDate;

    let { animStartLocationDate, animEndLocationDate } = this.props;
    // handle location update triggered from animation start/end date change from animation widget
    if (prevStartLocationDate && prevEndLocationDate) {
      if (prevStartLocationDate !== animStartLocationDate || prevEndLocationDate !== animEndLocationDate) {
        this.animationDraggerDateUpdate(animStartLocationDate, animEndLocationDate);
      }
    }

    // handle draggerTimeState updates if date changes
    if (this.props.dateA !== prevProps.dateA && this.props.dateA !== this.state.draggerTimeState) {
      this.setState({
        draggerTimeState: this.props.dateA
      });
    }
    if (this.props.dateB !== prevProps.dateB && this.props.dateB !== this.state.draggerTimeStateB) {
      this.setState({
        draggerTimeStateB: this.props.dateB
      });
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    this.setInitialState();
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

  changeDate = (date, draggerSelected = this.state.draggerSelected) => {
    this.debounceDateUpdate(new Date(date), draggerSelected);
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
      parentOffset,
      animStartLocationDate,
      animEndLocationDate,
      isAnimationWidgetOpen,
      animationDisabled,
      hideTimeline,
      timeScale
    } = this.props;
    return this.state.initialLoadComplete ? (
      <ErrorBoundary>
        <section id="timeline" className="timeline-inner clearfix">
          <div id="timeline-header"
            className={hasSubdailyLayers ? 'subdaily' : ''}
          >
            <div id="date-selector-main">
              <DateSelector
                // onDateChange={this.props.changeDate}
                onDateChange={this.changeDate}
                // date={new Date(dateA)}
                date={new Date(this.state.draggerTimeState)}
                // dateB={new Date(dateB)}
                dateB={new Date(this.state.draggerTimeStateB)}
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
                leftArrowDown={this.decrementDate}
                leftArrowUp={this.stopper}
                leftArrowDisabled={leftArrowDisabled}
                rightArrowDown={this.incrementDate}
                rightArrowUp={this.stopper}
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
                this.state.timelineHidden || hideTimeline ? 'none' : 'block'
            }}
          >
            {/* Timeline */}
            <TimelineAxis

            frontDate={this.state.frontDate}
            backDate={this.state.backDate}
              // {...this.props}
              isTimelineDragging={this.state.isTimelineDragging}
              moved={this.state.moved}
              axisWidth={axisWidth}
              dateA={dateA}
              dateB={dateB}
              // changeDate={this.props.changeDate}
              hasSubdailyLayers={hasSubdailyLayers}
              parentOffset={parentOffset}
              changeTimeScale={this.changeTimeScale}
              compareModeActive={compareModeActive}
              draggerSelected={draggerSelected}
              onChangeSelectedDragger={this.onChangeSelectedDragger}
              timelineStartDateLimit={timelineStartDateLimit}
              timelineEndDateLimit={timelineEndDateLimit}
              // changeAnimStartAndEndDate={this.props.changeStartAndEndDate}
              // changeAnimStartAndEndDate={this.updateAnimationDateAndLocation}
              // changeAnimStartDate={this.props.changeStartDate}
              // changeAnimEndDate={this.props.changeEndDate}
              animStartLocationDate={animStartLocationDate}
              animEndLocationDate={animEndLocationDate}
              isAnimationWidgetOpen={isAnimationWidgetOpen}
              isAnimationDraggerDragging={this.state.isAnimationDraggerDragging}
              updateDraggerDatePosition={this.updateDraggerDatePosition}
              draggerTimeState={this.state.draggerTimeState}
              draggerTimeStateB={this.state.draggerTimeStateB}
              // draggerTimeState={dateA}
              // draggerTimeStateB={dateB}
              draggerPosition={this.state.draggerPosition}
              draggerPositionB={this.state.draggerPositionB}
              draggerVisible={this.state.draggerVisible}
              draggerVisibleB={this.state.draggerVisibleB}
              transformX={this.state.transformX}
              updatePositioning={this.updatePositioning}
              position={this.state.position}
              animationStartLocation={this.state.animationStartLocation}
              animationEndLocation={this.state.animationEndLocation}
              timeScale={timeScale}
              // displayDate={this.displayDate}
              showHoverOn={this.showHoverOn}
              showHoverOff={this.showHoverOff}
              // toggleShowDraggerTime={this.toggleShowDraggerTime}
              showHover={this.showHover}
              leftOffset={this.state.leftOffset}
              showDraggerTime={this.state.showDraggerTime}
              hoverTime={this.state.hoverTime}
              showHoverLine={this.state.showHoverLine}
              isDraggerDragging={this.state.isDraggerDragging}
            />

            <HoverLine
              width={axisWidth}
              isTimelineDragging={this.state.isTimelineDragging}
              showHoverLine={this.state.showHoverLine}
              hoverLinePosition={this.state.hoverLinePosition}
            />

            {isAnimationWidgetOpen
              ? <TimelineRangeSelector
                position={this.state.position}
                frontDate={this.state.frontDate}
                isAnimationDraggerDragging={this.state.isAnimationDraggerDragging}
                timeScale={timeScale}
                startLocation={this.state.animationStartLocation}
                endLocation={this.state.animationEndLocation}
                startLocationDate={this.state.animationStartLocationDate}
                endLocationDate={this.state.animationEndLocationDate}
                timelineStartDateLimit={timelineStartDateLimit}
                timelineEndDateLimit={timelineEndDateLimit}
                updateAnimationDateAndLocation={this.updateAnimationDateAndLocation}
                animationDraggerDateUpdate={this.animationDraggerDateUpdate}
                max={this.state.rangeSelectorMax}
                pinWidth={5}
                width={axisWidth}
                transformX={this.state.transformX}
                rangeOpacity={0.3}
                rangeColor={'#45bdff'}
                startColor={'#40a9db'}
                startTriangleColor={'#fff'}
                endColor={'#295f92'}
                endTriangleColor={'#4b7aab'} />
              : null
            }
<<<<<<< HEAD
=======

>>>>>>> fix anim date inputs, continue large refactor and clean up
            {this.state.frontDate
              ? <DraggerContainer
                position={this.state.position}
                timelineStartDateLimit={timelineStartDateLimit}
                timelineEndDateLimit={timelineEndDateLimit}
                timeScale={timeScale}
                frontDate={this.state.frontDate}
                backDate={this.state.backDate}
                draggerSelected={draggerSelected}
                transformX={this.state.transformX}
                width={axisWidth}
                setDraggerVisibility={this.setDraggerVisibility}
                toggleShowDraggerTime={this.toggleShowDraggerTime}
                // handleDragDragger={this.handleDragDragger}
                // selectDragger={this.selectDragger}
                onChangeSelectedDragger={this.onChangeSelectedDragger}
                updateDraggerDatePosition={this.updateDraggerDatePosition}
                compareModeActive={compareModeActive}
                // draggerTimeState={dateA}
                // draggerTimeStateB={dateB}
                draggerTimeState={this.state.draggerTimeState}
                draggerTimeStateB={this.state.draggerTimeStateB}
                draggerPosition={this.state.draggerPosition}
                draggerPositionB={this.state.draggerPositionB}
                draggerVisible={this.state.draggerVisible}
                draggerVisibleB={this.state.draggerVisibleB}
                isDraggerDragging={this.state.isDraggerDragging}
              />
              : null }

            {!this.state.isTimelineDragging
              ? <DateToolTip
                draggerSelected={draggerSelected}
                draggerPosition={this.state.draggerPosition}
                draggerPositionB={this.state.draggerPositionB}
                hasSubdailyLayers={hasSubdailyLayers}
                leftOffset={this.state.leftOffset}
                showDraggerTime={this.state.showDraggerTime}
                draggerTimeState={this.state.draggerTimeState}
                draggerTimeStateB={this.state.draggerTimeStateB}
                hoverTime={this.state.hoverTime}
                showHoverLine={this.state.showHoverLine}
                axisWidth={axisWidth}
              />
              : null
            }

            {/* custom interval selector */}
            <CustomIntervalSelectorWidget
              customDelta={customIntervalValue}
              customIntervalZoomLevel={customIntervalZoomLevel}
              toggleCustomIntervalModal={this.toggleCustomIntervalModal}
              customIntervalModalOpen={this.state.customIntervalModalOpen}
              changeCustomInterval={this.changeCustomInterval}
              hasSubdailyLayers={hasSubdailyLayers}
            />
          </div>

          {/* Zoom Level Change */}
          <AxisTimeScaleChange
            isDraggerDragging={this.state.isDraggerDragging}
            timelineHidden={this.state.timelineHidden}
            timeScale={this.props.timeScale}
            changeTimeScale={this.changeTimeScale}
            hasSubdailyLayers={this.props.hasSubdailyLayers}
          />

          {/* 🍔 Open/Close Chevron 🍔 */}
          <div id="timeline-hide" onClick={this.toggleHideTimeline}>
            <div
              className={`wv-timeline-hide wv-timeline-hide-double-chevron-${
                this.state.timelineHidden ? 'left' : 'right'
              }`}
            />
          </div>
        </section>
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
    customDelta
  } = date;
  const { screenWidth } = browser;
  const { isCompareA, activeString } = compare;
  const compareModeActive = compare.active;
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

  // ! TEMP
  endTime = config.now;

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
    intervalChangeAmt: deltaChangeAmt,
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
    dispatch(changeStartAndEndDate(startDate, endDate))
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
  intervalChangeAmt: PropTypes.number,
  parentOffset: PropTypes.number,
  timelineEndDateLimit: PropTypes.string,
  leftArrowDisabled: PropTypes.bool,
  rightArrowDisabled: PropTypes.bool
};

// get axisWidth and parentOffset for axis, footer, and leftOffset calculations
const getOffsetValues = (innerWidth, hasSubDaily) => {
  const parentOffset = (hasSubDaily ? 414 : 310) + 10;
  const width =
    innerWidth - parentOffset - 20 - 20 - MARGIN.left - MARGIN.right + 28;
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
