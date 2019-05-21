import React from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';

import TimeScaleIntervalChange from './timeline-controls/interval-timescale-change';
import './timeline.css';
import TimelineAxis from './timeline-axis/timeline-axis';
import CustomIntervalSelectorWidget from './interval-selector/interval-selector';

import DateSelector from '../date-selector/date-selector';
import DateChangeArrows from './timeline-controls/date-change-arrows';
import AnimationButton from './timeline-controls/animation-button';

import AxisTimeScaleChange from './timeline-controls/axis-timescale-change';
import {
  hasSubDaily,
  lastDate as layersLastDate
} from 'modules/layers/selectors';
import { addDate } from 'modules/date/selectors';
import {
  timeScaleToNumberKey,
  timeScaleFromNumberKey
} from 'modules/layers/constants';

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
      customSelected: '',
      compareModeActive: '',
      dateFormatted: '',
      dateFormattedB: '',
      axisWidth: '',
      selectedDate: '',
      changeDate: '',
      timeScale: '',
      incrementDate: '',
      timeScaleChangeUnit: '',
      intervalText: '',
      customIntervalValue: '',
      customIntervalZoomLevel: '',
      intervalChangeAmt: '',
      hasSubdailyLayers: '',
      customIntervalModalOpen: false,
      timelineHidden: false,
      parentOffset: '',
      timelineStartDateLimit: '',
      timelineEndDateLimit: '',
      leftArrowDisabled: '',
      rightArrowDisabled: '',
      animationInProcess: false
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
      setState({
        animationInProcess: false
      });
      clearInterval(this.animator);
      this.animator = 0;
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
  animateByIncrement(delta, increment) {
    const { endTime, startDate, selectedDate } = this.props;
    const animationInProcess = this.state.animationInProcess;
    function animate() {
      var nextTime = getNextTimeSelection(delta, increment);
      if (subdaily) {
        // can we remove this logic?
        if (startDate <= nextTime && nextTime <= endTime) {
          changeDate(util.dateAdd(selectedDate, increment, delta));
        }
      } else {
        if (startDate <= nextTime && nextTime <= endTime) {
          changeDate(util.dateAdd(selectedDate, increment, delta));
        }
      }
      setState({
        animationInProcess: true
      });
      this.animator = setTimeout(animate, ANIMATION_DELAY);
    }
    animate();
  }

  updateDate(date) {
    this.props.changeDate(date);
  }

  // show/hide custom interval modal
  toggleCustomIntervalModal = () => {
    this.setState(prevState => ({
      customIntervalModalOpen: !prevState.customIntervalModalOpen
    }));
  };

  // Change the timescale parent state
  changeTimeScale = timeScaleNumber => {
    if (this.state.timeScale !== timeScaleFromNumberKey[timeScaleNumber]) {
      this.props.changeTimeScale(timeScaleNumber);
    }
  };

  // handle SET of custom time scale panel
  setIntervalChangeUnit = (intervalValue, zoomLevel) => {
    this.props.setIntervalInput(intervalValue, zoomLevel);
  };

  // handle SELECT of LEFT/RIGHT interval selection
  setTimeScaleIntervalChangeUnit = (
    intervalSelected,
    customSelected,
    openDialog
  ) => {
    let intervalChangeAmt;
    if (intervalSelected === 'custom') {
      intervalSelected = this.state.customIntervalZoomLevel;
      intervalChangeAmt = this.state.customIntervalValue;
    } else {
      intervalChangeAmt = 1;
    }
    this.props.setSelectedInterval(
      intervalSelected,
      intervalChangeAmt,
      customSelected,
      openDialog
    );
  };

  // left/right arrows increment date
  incrementDate = multiplier => {
    let delta = this.state.customSelected ? this.state.intervalChangeAmt : 1;
    this.animateByIncrement(
      Number(delta * multiplier),
      this.state.timeScaleChangeUnit
    );
  };

  // checkLeftArrowDisabled
  checkLeftArrowDisabled = () => {
    let {
      draggerSelected,
      dateFormatted,
      dateFormattedB,
      intervalChangeAmt,
      timeScaleChangeUnit,
      timelineStartDateLimit
    } = this.state;
    let previousIncrementDate;
    if (intervalChangeAmt && timeScaleChangeUnit) {
      if (draggerSelected === 'selected') {
        previousIncrementDate = moment
          .utc(dateFormatted)
          .subtract(intervalChangeAmt, timeScaleChangeUnit);
      } else {
        previousIncrementDate = moment
          .utc(dateFormattedB)
          .subtract(intervalChangeAmt, timeScaleChangeUnit);
      }
      this.setState({
        leftArrowDisabled: previousIncrementDate.isSameOrBefore(
          timelineStartDateLimit
        )
      });
    }
  };

  // checkRightArrowDisabled
  checkRightArrowDisabled = () => {
    let {
      draggerSelected,
      dateFormatted,
      dateFormattedB,
      intervalChangeAmt,
      timeScaleChangeUnit,
      timelineEndDateLimit
    } = this.state;
    let nextIncrementDate;
    if (intervalChangeAmt && timeScaleChangeUnit) {
      if (draggerSelected === 'selected') {
        nextIncrementDate = moment
          .utc(dateFormatted)
          .add(intervalChangeAmt, timeScaleChangeUnit);
      } else {
        nextIncrementDate = moment
          .utc(dateFormattedB)
          .add(intervalChangeAmt, timeScaleChangeUnit);
      }
      this.setState({
        rightArrowDisabled: nextIncrementDate.isSameOrAfter(
          timelineEndDateLimit
        )
      });
    }
  };

  // open animation dialog
  clickAnimationButton = () => {
    this.props.clickAnimationButton();
  };

  // toggle hide timeline
  toggleHideTimeline = () => {
    this.setState(
      {
        timelineHidden: !this.state.timelineHidden
      },
      this.props.toggleHideTimeline()
    );
  };

  componentDidMount() {
    this.init();
  }

  init = () => {
    // let timeScaleChangeUnitString = `${this.props.intervalDelta} ${timeUnitAbbreviations[this.props.intervalTimeScale]}`;
    this.setState({
      dateFormatted: this.props.selectedDate.toISOString(),
      dateFormattedB: this.props.selectedDateB
        ? this.props.selectedDateB.toISOString()
        : null,
      draggerSelected: this.props.draggerSelected,
      axisWidth: this.props.axisWidth,
      selectedDate: this.props.selectedDate.toISOString(),
      changeDate: this.props.changeDate,
      timeScale: this.props.timeScale,
      incrementDate: this.props.incrementDate,
      timeScaleChangeUnit: this.props.intervalTimeScale,
      customIntervalValue: this.props.intervalDelta,
      intervalChangeAmt: this.props.intervalDelta,
      customIntervalZoomLevel: this.props.customIntervalZoomLevel,
      hasSubdailyLayers: this.props.hasSubdailyLayers,
      intervalText: this.props.timeScale,
      compareModeActive: this.props.compareModeActive,
      customSelected: this.props.customSelected,
      parentOffset: this.props.parentOffset,
      timelineStartDateLimit: this.props.timelineStartDateLimit,
      timelineEndDateLimit: this.props.timelineEndDateLimit,
      animStartLocationDate: this.props.animStartLocationDate,
      animEndLocationDate: this.props.animEndLocationDate,
      isAnimationWidgetOpen: this.props.isAnimationWidgetOpen,
      leftArrowDisabled: this.checkLeftArrowDisabled(),
      rightArrowDisabled: this.checkRightArrowDisabled()
    });
  };
  componentDidUpdate(prevProps, prevState) {
    let {
      intervalChangeAmt,
      timeScaleChangeUnit,
      draggerSelected,
      dateFormatted,
      dateFormattedB
    } = this.state;
    if (
      intervalChangeAmt !== prevState.intervalChangeAmt ||
      timeScaleChangeUnit !== prevState.timeScaleChangeUnit ||
      (draggerSelected === 'selected' &&
        dateFormatted !== prevState.dateFormatted) ||
      (draggerSelected === 'selectedB' &&
        dateFormattedB !== prevState.dateFormattedB) ||
      draggerSelected !== prevState.draggerSelected
    ) {
      this.checkLeftArrowDisabled();
      this.checkRightArrowDisabled();
    }
  }

  render() {
    return this.state.dateFormatted ? (
      <React.Fragment>
        <div
          id="timeline-header"
          className={this.state.hasSubdailyLayers ? 'subdaily' : ''}
        >
          <div id="date-selector-main">
            <DateSelector
              {...this.props}
              onDateChange={this.updateDate}
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
              customIntervalZoomLevel={this.state.customIntervalZoomLevel}
              customSelected={customSelected}
              customIntervalValue={customIntervalValue}
              timeScaleChangeUnit={this.state.timeScaleChangeUnit}
            />

            <DateChangeArrows
              leftArrowDown={() => this.incrementDate(-1)}
              leftArrowUp={this.stopper}
              leftArrowDisabled={this.state.leftArrowDisabled}
              rightArrowDown={() => this.incrementDate(1)}
              rightArrowUp={stopper}
              rightArrowDisabled={this.state.rightArrowDisabled}
            />
          </div>

          <AnimationButton clickAnimationButton={this.clickAnimationButton} />
        </div>
        <div id="timeline-footer">
          <div id="wv-animation-widet-case"> </div>
          {/* Timeline */}
          <TimelineAxis
            {...this.state}
            axisWidth={axisWidth}
            selectedDate={dateFormatted}
            selectedDateB={dateFormattedB}
            updateDate={this.updateDate}
            hasSubdailyLayers={hasSubdailyLayers}
            parentOffset={this.state.parentOffset}
            changeTimeScale={this.changeTimeScale}
            compareModeActive={this.state.compareModeActive}
            draggerSelected={this.state.draggerSelected}
            onChangeSelectedDragger={this.props.onChangeSelectedDragger}
            timelineStartDateLimit={this.state.timelineStartDateLimit}
            timelineEndDateLimit={this.state.timelineEndDateLimit}
            customIntervalModalOpen={this.state.customIntervalModalOpen}
            updateAnimationRange={this.props.updateAnimationRange}
            animStartLocationDate={this.state.animStartLocationDate}
            animEndLocationDate={this.state.animEndLocationDate}
            isAnimationWidgetOpen={this.state.isAnimationWidgetOpen}
          />

          {/* custom interval selector */}
          <CustomIntervalSelectorWidget
            customIntervalValue={customIntervalValue}
            customIntervalZoomLevel={customIntervalZoomLevel}
            toggleCustomIntervalModal={this.toggleCustomIntervalModal}
            customIntervalModalOpen={this.state.customIntervalModalOpen}
            setIntervalChangeUnit={this.setIntervalChangeUnit}
            hasSubdailyLayers={hasSubdailyLayers}
          />
        </div>

        {/* Zoom Level Change */}
        <div
          className="zoom-level-change"
          style={{
            width: '75px',
            display: this.state.timelineHidden ? 'none' : 'block'
          }}
        >
          <AxisTimeScaleChange
            timeScale={this.state.timeScale}
            changeTimeScale={this.changeTimeScale}
            hasSubdailyLayers={this.state.hasSubdailyLayers}
          />
        </div>

        {/* 🍔 Open/Close Chevron 🍔 */}
        <div id="timeline-hide" onClick={this.toggleHideTimeline}>
          {/* {this.state.timelineHidden ? */}
          <div
            className={`wv-timeline-hide wv-timeline-hide-double-chevron-${
              this.state.timelineHidden ? 'left' : 'right'
            }`}
          />
          {/* : */}
          {/* <div className="wv-timeline-hide wv-timeline-hide-double-chevron-right"></div> */}
          {/* } */}
        </div>
      </React.Fragment>
    ) : null;
  }
}
function mapStateToProps(state) {
  const { config, compare, layers, browser, date } = state;
  const {
    customSelected,
    selected,
    selectedB,
    zoomLevel,
    interval,
    customInterval
  } = date;
  const { screenWidth } = browser;
  const { isCompareA, active } = compare;
  const compareModeActive = active;
  let hasSubdailyLayers = hasSubDaily(layers[compare.activeString]);

  if (isCompareModeActive) {
    hasSubdailyLayers =
      hasSubDaily(layers['active']) || hasSubDaily(layers['activeB']);
    endTime = getEndTime(layers, config);
  } else {
    hasSubdailyLayers = hasSubDaily(layers[compare.activeString]);
    endTime = layersLastDateTime(activeLayers, config);
  }
  const dimensionsAndOffsetValues = getOffsetValues(screenWidth, hasSubDaily);
  const timelineEndDateLimit = endTime.toISOString();

  return {
    hasSubdailyLayers,
    customSelected,
    compareModeActive,
    dateFormatted: selected.toISOString(),
    dateFormattedB: selectedB.toISOString(),
    startDate: config.startDate,
    timelineStartDateLimit: config.startDate, // same as startDate
    endTime,
    isAnimationWidgetOpen: animation.active,
    axisWidth: dimensionsAndOffsetValues.width,
    selectedDate: isCompareA ? selected : selectedB,
    timeScale: timeScaleFromNumberKey[selectedZoom],
    timeScaleChangeUnit: customSelected
      ? timeScaleFromNumberKey[customInterval]
      : timeScaleFromNumberKey[interval],
    customIntervalValue: customDelta,
    customIntervalZoomLevel: customInterval,
    intervalChangeAmt: interval,
    parentOffset: dimensionsAndOffsetValues.parentOffset,
    timelineEndDateLimit
  };
}

const mapDispatchToProps = dispatch => ({
  changeDate: val => {
    dispatch(selectDate(val));
  }
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

function getOffsetValues(innerWidth, hasSubDaily) {
  const parentOffset = (hasSubDaily ? 414 : 310) + 10;

  const width =
    innerWidth - parentOffset - 20 - 20 - MARGIN.left - MARGIN.right + 28;
  return { width, parentOffset };
}

function getEndTime(layers, config) {
  const endDateA = layersLastDateTime(layers['active'], config);
  const endDateB = layersLastDateTime(layers['activeB'], config);
  return endDateA > endDateB ? endDateA : endDateB;
}
/**
 * @param  {Number} delta Date and direction to change
 * @param  {Number} increment Zoom level of change
 *                  e.g. months,minutes, years, days
 * @return {Object} JS Date Object
 */
var getNextTimeSelection = function(delta, increment, prevDate) {
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
