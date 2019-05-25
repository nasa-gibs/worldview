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
import AnimationWidget from '../../containers/animation-widget';
import AnimationButton from '../../components/timeline/timeline-controls/animation-button';

import AxisTimeScaleChange from '../../components/timeline/timeline-controls/axis-timescale-change';
import {
  hasSubDaily,
  lastDate as layersLastDateTime
} from '../../modules/layers/selectors';
import { selectDate, changeTimeScale, selectInterval, changeCustomInterval } from '../../modules/date/actions';
import { toggleActiveCompareState } from '../../modules/compare/actions';
import { onActivate as openAnimation, onClose as closeAnimation } from '../../modules/animation/actions';
import { timeScaleFromNumberKey, timeScaleToNumberKey } from '../../modules/date/constants';

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
      customIntervalModalOpen: false
    };
    this.animator = 0;
  }
  /**
   *  Clear animateByIncrement's Timeout
   *
   * @return {void}
   */
  stopper() {
    if (this.state.animationInProcess) {
      clearInterval(this.animator);
      this.animator = 0;
      this.setState({
        animationInProcess: false
      });
    }
  }
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
      startDate,
      selectedDate,
      hasSubdailyLayers,
      changeDate
    } = this.props;

    let animate = () => {
      var nextTime = getNextTimeSelection(delta, increment, selectedDate);
      if (hasSubdailyLayers) {
        // can we remove this logic?
        if (new Date(startDate) <= nextTime && nextTime <= endTime) {
          changeDate(util.dateAdd(selectedDate, increment, delta));
        }
      } else {
        if (new Date(startDate) <= nextTime && nextTime <= endTime) {
          changeDate(util.dateAdd(selectedDate, increment, delta));
        }
      }
      this.animator = setTimeout(animate, ANIMATION_DELAY);
      this.setState({
        animationInProcess: true
      });
    };
    animate();
  }

  // show/hide custom interval modal
  toggleCustomIntervalModal = () => {
    this.setState(prevState => ({
      customIntervalModalOpen: !prevState.customIntervalModalOpen
    }));
  }

  // Change the timescale parent state
  changeTimeScale = (timeScaleNumber) => {
    this.props.changeTimeScale(timeScaleNumber);
  }

  // handle SET of custom time scale panel
  changeCustomInterval = (delta, timeScale) => {
    this.props.changeCustomInterval(Number(delta), Number(timeScale));
  }

  // handle SELECT of LEFT/RIGHT interval selection
  setTimeScaleIntervalChangeUnit = (intervalSelected, customIntervalModalOpen) => {
    let delta;
    let customSelected = intervalSelected === 'custom';
    if (customSelected) {
      intervalSelected = this.props.customIntervalZoomLevel;
      delta = this.props.customIntervalValue;
    } else {
      intervalSelected = Number(timeScaleToNumberKey[intervalSelected]);
      delta = 1;
    }
    this.props.selectInterval(delta, intervalSelected, customSelected);
    this.setState({
      customIntervalModalOpen: !!customIntervalModalOpen
    });
  }

  // left/right arrows increment date
  incrementDate = (multiplier) => {
    let delta = this.props.customSelected ? this.props.intervalChangeAmt : 1;
    this.animateByIncrement(
      Number(delta * multiplier),
      this.props.timeScaleChangeUnit
    );
  }

  // open animation dialog
  clickAnimationButton = () => {
    if (this.props.isAnimationWidgetOpen) {
      this.props.closeAnimation();
    } else {
      this.props.openAnimation();
    }
    // Will be a setState({})
    // a deriveStateFromProps will be wanted with this one
  }

  // toggle hide timeline
  toggleHideTimeline = () => {
    this.setState({
      timelineHidden: !this.state.timelineHidden
    });
  }

  // toggle selected dragger for comparison mode/focused date used in date selector
  onChangeSelectedDragger = () => {
    this.props.toggleActiveCompareState();
  }

  // update range of animation draggers
  updateAnimationRange = (startDate, endDate) => {
    // ! PLACE HOLDER - OLD VERSION
    // ui.anim.rangeselect.updateRange(startDate, endDate, true);
  };

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
      isAnimationWidgetOpen
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
              />
            </div>
            <div id="zoom-buttons-group">
              <TimeScaleIntervalChange
                setTimeScaleIntervalChangeUnit={
                  this.setTimeScaleIntervalChangeUnit
                }
                customIntervalZoomLevel={timeScaleFromNumberKey[customIntervalZoomLevel]}
                customSelected={customSelected}
                customDelta={customIntervalValue}
                timeScaleChangeUnit={timeScaleChangeUnit}
              />

              <DateChangeArrows
                leftArrowDown={() => this.incrementDate(-1)}
                leftArrowUp={this.stopper.bind(this)}
                leftArrowDisabled={leftArrowDisabled}
                rightArrowDown={() => this.incrementDate(1)}
                rightArrowUp={this.stopper.bind(this)}
                rightArrowDisabled={rightArrowDisabled}
              />
            </div>

            <AnimationButton clickAnimationButton={this.clickAnimationButton} />
          </div>
          <div id="timeline-footer"
            style={{ display: this.state.timelineHidden ? 'none' : 'block' }}
          >
            <div id="wv-animation-widet-case">
              { isAnimationWidgetOpen
                ? <AnimationWidget />
                : null
              }
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
              onChangeSelectedDragger={this.onChangeSelectedDragger.bind(this)}
              timelineStartDateLimit={timelineStartDateLimit}
              timelineEndDateLimit={timelineEndDateLimit}
              updateAnimationRange={this.updateAnimationRange.bind(this)}
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
  const { config, compare, layers, browser, date, animation } = state;
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
  let endTime;
  if (compareModeActive) {
    hasSubdailyLayers =
      hasSubDaily(layers['active']) || hasSubDaily(layers['activeB']);
    endTime = getEndTime(layers, config);
  } else {
    hasSubdailyLayers = hasSubDaily(layers[compare.activeString]);
    endTime = layersLastDateTime(layers[activeString], config);
  }
  const dimensionsAndOffsetValues = getOffsetValues(screenWidth, hasSubdailyLayers);
  const timelineEndDateLimit = endTime.toISOString();

  let selectedDate = isCompareA ? selected : selectedB;
  let deltaChangeAmt = customSelected
    ? customDelta
    : delta;
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
    customIntervalValue: customDelta,
    customIntervalZoomLevel: customInterval,
    intervalChangeAmt: deltaChangeAmt,
    parentOffset: dimensionsAndOffsetValues.parentOffset,
    timelineEndDateLimit,
    leftArrowDisabled,
    rightArrowDisabled
  };
}

const mapDispatchToProps = dispatch => ({
  // changes date of active dragger 'selected' or 'selectedB'
  changeDate: val => {
    dispatch(selectDate(val));
  },
  // changes/sets custom delta and timescale interval, sets customSelected to TRUE
  changeCustomInterval: (delta, timeScale) => {
    dispatch(changeCustomInterval(delta, timeScale));
  },
  // changes timescale (scale of grids vs. what LEFT/RIGHT arrow do)
  changeTimeScale: val => {
    dispatch(changeTimeScale(val));
  },
  // changes to non-custom timescale interval, sets customSelected to FALSE
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
  }
  // set currently selected delta - will always be 1 if !customSelected
  // selectDelta: val => {
  //   dispatch(selectDelta(val));
  // }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Timeline);

Timeline.propTypes = {
  proj: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  models: PropTypes.object.isRequired,
  url: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  screenWidth: PropTypes.number,
  screenHeight: PropTypes.number
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
const checkLeftArrowDisabled = (date, delta, timeScaleChangeUnit, timelineStartDateLimit) => {
  let nextDecrementDate = moment
    .utc(date)
    .subtract(delta, timeScaleChangeUnit);
  return nextDecrementDate.isSameOrBefore(
    timelineStartDateLimit
  );
};

// check if right arrow should be disabled on predicted increment
const checkRightArrowDisabled = (date, delta, timeScaleChangeUnit, timelineEndDateLimit) => {
  let nextIncrementDate = moment
    .utc(date)
    .add(delta, timeScaleChangeUnit);
  return nextIncrementDate.isSameOrAfter(
    timelineEndDateLimit
  );
};
