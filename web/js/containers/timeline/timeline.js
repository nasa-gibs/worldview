import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import ErrorBoundary from '../../containers/error-boundary';
import TimeScaleIntervalChange from '../../components/timeline/timeline-controls/interval-timescale-change';
import '../../components/timeline/timeline.css';
import TimelineAxis from '../../components/timeline/timeline-axis/timeline-axis';
import CustomIntervalSelectorWidget from '../../components/timeline/interval-selector/interval-selector';
import util from '../../util/util';
import DateSelector from '../../components/date-selector/date-selector';
import DateChangeArrows from '../../components/timeline/timeline-controls/date-change-arrows';
import AnimationWidget from '../animation-widget';
import AnimationButton from '../../components/timeline/timeline-controls/animation-button';
import AxisTimeScaleChange from '../../components/timeline/timeline-controls/axis-timescale-change';

import {debounce as lodashDebounce, get as lodashGet} from 'lodash';

import {
  hasSubDaily,
  lastDate as layersLastDateTime
} from '../../modules/layers/selectors';
import {
  selectDate,
  changeTimeScale,
  selectInterval,
  changeCustomInterval
} from '../../modules/date/actions';
import { toggleActiveCompareState } from '../../modules/compare/actions';
import {
  onActivate as openAnimation,
  onClose as closeAnimation,
  changeStartDate,
  changeEndDate
} from '../../modules/animation/actions';
import {
  timeScaleFromNumberKey,
  timeScaleToNumberKey
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
      animationInProcess: false
    };
    // left/right arrows
    this.animator = 0;
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

  // update range of animation draggers
  updateAnimationRange = (startDate, endDate) => {
    this.props.changeStartDate(startDate);
    this.props.changeEndDate(endDate);
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

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  render() {
    const {
      dateFormatted,
      dateFormattedB,
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
      hideTimeline
    } = this.props;
    return dateFormatted ? (
      <ErrorBoundary>
        <section id="timeline" className="timeline-inner clearfix">
          <div
            id="timeline-header"
            className={hasSubdailyLayers ? 'subdaily' : ''}
          >
            <div id="date-selector-main">
              <DateSelector
                {...this.props}
                onDateChange={this.props.changeDate}
                date={new Date(dateFormatted)}
                dateB={new Date(dateFormattedB)}
                hasSubdailyLayers={hasSubdailyLayers}
                draggerSelected={draggerSelected}
                maxDate={new Date(timelineEndDateLimit)}
                minDate={new Date(timelineStartDateLimit)}
              />
            </div>
            <div id="zoom-buttons-group">
              <TimeScaleIntervalChange
                setTimeScaleIntervalChangeUnit={
                  this.setTimeScaleIntervalChangeUnit
                }
                customIntervalZoomLevel={
                  timeScaleFromNumberKey[customIntervalZoomLevel]
                }
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
          <div
            id="timeline-footer"
            style={{
              display:
                this.state.timelineHidden || hideTimeline ? 'none' : 'block'
            }}
          >
            <div id="wv-animation-widet-case">
              {isAnimationWidgetOpen ? <AnimationWidget /> : null}
            </div>
            {/* Timeline */}
            <TimelineAxis
              {...this.props}
              axisWidth={axisWidth}
              selectedDate={dateFormatted}
              selectedDateB={dateFormattedB}
              changeDate={this.props.changeDate}
              hasSubdailyLayers={hasSubdailyLayers}
              parentOffset={parentOffset}
              changeTimeScale={this.changeTimeScale}
              compareModeActive={compareModeActive}
              draggerSelected={draggerSelected}
              onChangeSelectedDragger={this.onChangeSelectedDragger}
              timelineStartDateLimit={timelineStartDateLimit}
              timelineEndDateLimit={timelineEndDateLimit}
              updateAnimationRange={this.updateAnimationRange}
              animStartLocationDate={animStartLocationDate}
              animEndLocationDate={animEndLocationDate}
              isAnimationWidgetOpen={isAnimationWidgetOpen}
            />

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
    legacy,
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
  const dimensionsAndOffsetValues = getOffsetValues(
    screenWidth,
    hasSubdailyLayers
  );
  const timelineEndDateLimit = endTime.toISOString();

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
    dateFormatted: selected.toISOString(),
    dateFormattedB: selectedB.toISOString(),
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
      !lodashGet(legacy, 'map.ui.selected.frameState_') ||
      sidebar.activeTab === 'download'
  };
}

const mapDispatchToProps = dispatch => ({
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
  changeStartDate: date => {
    dispatch(changeStartDate(date));
  },
  changeEndDate: date => {
    dispatch(changeEndDate(date));
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
  dateFormatted: PropTypes.string,
  dateFormattedB: PropTypes.string,
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
  return nextDecrementDate.isSameOrBefore(timelineStartDateLimit);
};

// check if right arrow should be disabled on predicted increment
const checkRightArrowDisabled = (
  date,
  delta,
  timeScaleChangeUnit,
  timelineEndDateLimit
) => {
  let nextIncrementDate = moment.utc(date).add(delta, timeScaleChangeUnit);
  return nextIncrementDate.isSameOrAfter(timelineEndDateLimit);
};
