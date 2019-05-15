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

// const timeUnitAbbreviations = {
//   year: 'year',
//   month: 'mon',
//   day: 'day',
//   hour: 'hour',
//   minute: 'min'
// };

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
      rightArrowDisabled: ''
    };
  }

  updateDate = (date, selectionStr) => {
    // console.log(date,selectionStr)
    this.props.updateDate(date, selectionStr);
  }

  // show/hide custom interval modal
  toggleCustomIntervalModal = () => {
    this.setState(prevState => ({
      customIntervalModalOpen: !prevState.customIntervalModalOpen
    }));
  }

  // Change the timescale parent state
  changeTimescale = (timeScale) => {
    if (this.state.timeScale !== timeScale) {
      this.props.changeTimeScale(timeScale);
    }
  }

  // handle SET of custom time scale panel
  setIntervalChangeUnit = (intervalValue, zoomLevel) => {
    this.props.setIntervalInput(intervalValue, zoomLevel)
  }

  // handle SELECT of LEFT/RIGHT interval selection
  setTimeScaleIntervalChangeUnit = (intervalSelected, customSelected, openDialog) => {
    let intervalChangeAmt;
    if (intervalSelected === 'custom') {
      intervalSelected = this.state.customIntervalZoomLevel;
      intervalChangeAmt = this.state.customIntervalValue;
    } else {
      intervalChangeAmt = 1;
    }
    this.props.setSelectedInterval(intervalSelected, intervalChangeAmt, customSelected, openDialog);
  }

  // left/right arrows increment date
  incrementDate = (multiplier) => {
    let delta = this.state.customSelected ? this.state.intervalChangeAmt : 1;
    this.props.incrementDate(Number(delta * multiplier), this.state.timeScaleChangeUnit)
  }

  // checkLeftArrowDisabled
  checkLeftArrowDisabled = () => {
    let previousPastDateBasedOnIncrement;
    if (this.state.draggerSelected === 'selected') {
      previousPastDateBasedOnIncrement = moment.utc(this.state.dateFormatted).subtract(this.state.intervalChangeAmt, this.state.timeScaleChangeUnit);
    } else {
      previousPastDateBasedOnIncrement = moment.utc(this.state.dateFormattedB).subtract(this.state.intervalChangeAmt, this.state.timeScaleChangeUnit);
    }
    this.setState({
      leftArrowDisabled: previousPastDateBasedOnIncrement.isSameOrBefore(this.state.timelineStartDateLimit)
    })
  }

  // checkRightArrowDisabled
  checkRightArrowDisabled = () => {
    let nextFutureDateBasedOnIncrement;
    if (this.state.draggerSelected === 'selected') {
      nextFutureDateBasedOnIncrement = moment.utc(this.state.dateFormatted).add(this.state.intervalChangeAmt, this.state.timeScaleChangeUnit);
    } else {
      nextFutureDateBasedOnIncrement = moment.utc(this.state.dateFormattedB).add(this.state.intervalChangeAmt, this.state.timeScaleChangeUnit);
    }
    this.setState({
      rightArrowDisabled: nextFutureDateBasedOnIncrement.isSameOrAfter(this.state.timelineEndDateLimit)
    })
  }

  // open animation dialog
  clickAnimationButton = () => {
    this.props.clickAnimationButton();
  }

  // toggle hide timeline
  toggleHideTimeline = () => {
    this.setState({
      timelineHidden: !this.state.timelineHidden
    }, this.props.toggleHideTimeline());
  }

  componentDidMount() {
    this.init();
  }

  init = () => {
    // let timeScaleChangeUnitString = `${this.props.intervalDelta} ${timeUnitAbbreviations[this.props.intervalTimeScale]}`;
    this.setState({
      dateFormatted: this.props.selectedDate.toISOString(),
      dateFormattedB: this.props.selectedDateB ? this.props.selectedDateB.toISOString() : null,
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
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   return true;
  // }

  componentDidUpdate(prevProps, prevState) {
    if ((this.state.intervalChangeAmt !== prevState.intervalChangeAmt || this.state.timeScaleChangeUnit !== prevState.timeScaleChangeUnit)
     || (this.state.draggerSelected === 'selected' && this.state.dateFormatted !== prevState.dateFormatted)
     || (this.state.draggerSelected === 'selectedB' && this.state.dateFormattedB !== prevState.dateFormattedB)) {
        this.checkLeftArrowDisabled();
        this.checkRightArrowDisabled();
    }
  }

  render() {
    // console.log(this.state.selectedDate, this.state.dateFormatted)
    return (
      this.state.dateFormatted ?
      <React.Fragment>
        <div id="timeline-header" className={this.state.hasSubdailyLayers ? 'subdaily' : ''}>
          <div id="date-selector-main">
            <DateSelector
              {...this.props}
              onDateChange={this.updateDate}
              date={new Date(this.state.dateFormatted)}
              dateB={new Date(this.state.dateFormattedB)}
              hasSubdailyLayers={this.state.hasSubdailyLayers}
              draggerSelected={this.state.draggerSelected}
            />
          </div>
          <div id="zoom-buttons-group">
            <TimeScaleIntervalChange
              setTimeScaleIntervalChangeUnit={this.setTimeScaleIntervalChangeUnit}
              customIntervalZoomLevel={this.state.customIntervalZoomLevel}
              customSelected={this.state.customSelected}
              customIntervalValue={this.state.customIntervalValue}
              timeScaleChangeUnit={this.state.timeScaleChangeUnit}
            />

            <DateChangeArrows
              leftArrowDown={() => this.incrementDate(-1)}
              leftArrowUp={this.props.stopper}
              leftArrowDisabled={this.state.leftArrowDisabled}
              rightArrowDown={() => this.incrementDate(1)}
              rightArrowUp={this.props.stopper}
              rightArrowDisabled={this.state.rightArrowDisabled}
            />
          </div>

          <AnimationButton
            clickAnimationButton={this.clickAnimationButton}
          />
        </div>
        <div id="timeline-footer">
          <div id="wv-animation-widet-case"> </div>
          {/* Timeline */}
          <TimelineAxis
            {...this.state}
            axisWidth={this.state.axisWidth}
            selectedDate={this.state.dateFormatted}
            selectedDateB={this.state.dateFormattedB}
            updateDate={this.updateDate}
            hasSubdailyLayers={this.state.hasSubdailyLayers}
            parentOffset={this.state.parentOffset}
            changeTimescale={this.changeTimescale}
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
          customIntervalValue={this.state.customIntervalValue}
          customIntervalZoomLevel={this.state.customIntervalZoomLevel}
          toggleCustomIntervalModal={this.toggleCustomIntervalModal}
          customIntervalModalOpen={this.state.customIntervalModalOpen}
          setIntervalChangeUnit={this.setIntervalChangeUnit}
          hasSubdailyLayers={this.state.hasSubdailyLayers}
        />
        </div>

        {/* Zoom Level Change */}
        <div className="zoom-level-change" style={{ width: '75px', display: this.state.timelineHidden ? 'none' : 'block'}}>
          <AxisTimeScaleChange
          timeScale={this.state.timeScale}
          changeTimescale={this.changeTimescale}
          hasSubdailyLayers={this.state.hasSubdailyLayers}
          />
        </div>

        {/* 🍔 Open/Close Chevron 🍔 */}
        <div id="timeline-hide" onClick={this.toggleHideTimeline}>
          {this.state.timelineHidden ?
          <div className="wv-timeline-hide wv-timeline-hide-double-chevron-left"></div>
          :
          <div className="wv-timeline-hide wv-timeline-hide-double-chevron-right"></div>
          }
        </div>
      </React.Fragment>
      :
      null
    );
  }
}
// Timeline.defaultProps = {
// };
// Timeline.propTypes = {
//   width: PropTypes.number,
//   drawContainers: PropTypes.func,
//   changeDate: PropTypes.func,
//   selectedDate: PropTypes.instanceOf(Date)
// };

export default Timeline;
