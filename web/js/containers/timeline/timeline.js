import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import ErrorBoundary from '../../containers/error-boundary';
import TimeScaleIntervalChange from '../../components/timeline/timeline-controls/interval-timescale-change';
import '../../components/timeline/timeline.css';
import TimelineAxis from '../../components/timeline/timeline-axis/timeline-axis';
import TimelineRangeSelector from '../../components/range-selection/range-selection';
import CustomIntervalSelectorWidget from '../../components/timeline/interval-selector/interval-selector';
import util from '../../util/util';
import DateSelector from '../../components/date-selector/date-selector';
import DateChangeArrows from '../../components/timeline/timeline-controls/date-change-arrows';

import AnimationButton from '../../components/timeline/timeline-controls/animation-button';
import AxisTimeScaleChange from '../../components/timeline/timeline-controls/axis-timescale-change';

import { debounce as lodashDebounce, get as lodashGet } from 'lodash';
import { getISODateFormatted } from '../../components/timeline/date-util';

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
      timelineHidden: false,
      customIntervalModalOpen: false,
      animationInProcess: false,
      position: 0,
      transformX: 0,
      frontDate: '',
      animationStartLocation: 0,
      animationEndLocation: 0
    };
    // left/right arrows
    this.animator = 0;
  }

  updateDynamicPositioning = (position, transformX, frontDate, animationStartLocation, animationEndLocation) => {
    console.log(position, transformX, frontDate, animationStartLocation, animationEndLocation)

    this.setState({
      position,
      transformX: transformX || this.state.transformX,
      frontDate: frontDate || this.state.frontDate,
      animationStartLocation: animationStartLocation || this.state.animationStartLocation,
      animationEndLocation: animationEndLocation || this.state.animationEndLocation
    });
  }

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
    const { endTime, startDate, hasSubdailyLayers, changeDate } = this.props;

    let animate = () => {
      var nextTime = getNextTimeSelection(
        delta,
        increment,
        this.props.selectedDate
      );
      if (hasSubdailyLayers) {
        // can we remove this logic?
        if (new Date(startDate) <= nextTime && nextTime <= endTime) {
          changeDate(util.dateAdd(this.props.selectedDate, increment, delta));
        }
      } else {
        if (new Date(startDate) <= nextTime && nextTime <= endTime) {
          changeDate(util.dateAdd(this.props.selectedDate, increment, delta));
        }
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





  updateAnimationDateAndLocation = (animationStartLocationDate, animationEndLocationDate, animationStartLocation, animationEndLocation) => {
    console.log(animationStartLocationDate)
    this.setState({
      animationStartLocation: animationStartLocation || this.state.animationStartLocation,
      animationEndLocation: animationEndLocation || this.state.animationEndLocation
    }, this.determineNecessaryAnimationDraggerUpdate(animationStartLocationDate, animationEndLocationDate));
  }

  determineNecessaryAnimationDraggerUpdate = (animationStartLocationDate, animationEndLocationDate) => {
    let startChanged = this.props.animationStartLocationDate !== animationStartLocationDate;
    let endChanged = this.props.animationEndLocationDate !== animationEndLocationDate;
    if (startChanged) {
      if (endChanged) {
        this.props.changeStartAndEndDate(animationStartLocationDate, animationEndLocationDate);
      } else {
        this.props.changeStartDate(animationStartLocationDate);
      }
    } else {
      if (endChanged) {
        this.props.changeEndDate(animationEndLocationDate);
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
    console.log(endLocation)
    this.setState({
      animationStartLocation: position - startLocation + transformX,
      animationEndLocation: position - endLocation + transformX
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
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
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
    console.log(this.state.animationStartLocation)
    return dateA ? (
      <ErrorBoundary>
        <section id="timeline" className="timeline-inner clearfix">
          <div id="timeline-header"
            className={hasSubdailyLayers ? 'subdaily' : ''}
          >
            <div id="date-selector-main">
              <DateSelector
                onDateChange={this.props.changeDate}
                date={new Date(dateA)}
                dateB={new Date(dateB)}
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
              // {...this.props}
              axisWidth={axisWidth}
              dateA={dateA}
              dateB={dateB}
              changeDate={this.props.changeDate}
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


              updateDynamicPositioning={this.updateDynamicPositioning}
              position={this.state.position}
              transformX={this.state.transformX}
              frontDate={this.state.frontDate}
              animationStartLocation={this.state.animationStartLocation}
              animationEndLocation={this.state.animationEndLocation}
              timeScale={timeScale}
            />

            {isAnimationWidgetOpen
              ? <TimelineRangeSelector
                timeScale={timeScale}
                startLocation={this.state.animationStartLocation}
                endLocation={this.state.animationEndLocation}
                startLocationDate={animStartLocationDate}
                endLocationDate={animEndLocationDate}
                timelineStartDateLimit={timelineStartDateLimit}
                timelineEndDateLimit={timelineEndDateLimit}
                updateAnimationDateAndLocation={this.updateAnimationDateAndLocation}
                animationDraggerDateUpdate={this.animationDraggerDateUpdate}
                max={{ end: false, start: false, startOffset: -50, width: 50000 }}
                pinWidth={5}
                height={45}
                width={axisWidth}
                transformX={this.state.transformX}
                // onDrag={this.animationDraggerPositionUpdate}
                // onHover={this.showHoverOff}
                onDrag={() => console.log('animationDraggerPositionUpdate')}
                onHover={() => console.log('showHoverOff')}
                // onRangeClick={this.setLineTime}
                onRangeClick={() => console.log('onRangeClick')}
                rangeOpacity={0.3}
                rangeColor={'#45bdff'}
                startColor={'#40a9db'}
                startTriangleColor={'#fff'}
                endColor={'#295f92'}
                endTriangleColor={'#4b7aab'} />
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
  changeStartDate: date => {
    dispatch(changeStartDate(date));
  },
  // update anim endDate
  changeEndDate: date => {
    dispatch(changeEndDate(date));
  },
  // update anim startDate and endDate
  changeStartAndEndDate: (startDate, endDate) => {
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
  intervalChangeAmt: PropTypes.number,
  parentOffset: PropTypes.number,
  timelineEndDateLimit: PropTypes.string,
  leftArrowDisabled: PropTypes.bool,
  rightArrowDisabled: PropTypes.bool
};

// get axisWidth and parentOffset for axis, footer, and leftoffset calculations
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
