import React from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';

import TimeScaleIntervalChange from './timeline-controls/interval-timescale-change';
import './timeline.css';
import TimelineAxisContainer from './timeline-axis/timeline-axis-container';
import IntervalSelectorWidget from './interval-selector/interval-selector';

import DateSelector from '../date-selector/date-selector';
import DateChangeArrows from './timeline-controls/date-change-arrows';
import AnimationButton from './timeline-controls/animation-button';

import AxisTimeScaleChange from './timeline-controls/axis-timescale-change';

const timeUnitAbbreviations = {
  year: 'year',
  month: 'mon',
  day: 'day',
  hour: 'hour',
  minute: 'min'
};

class Timeline extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      compareModeActive: '',
      dateFormatted: '',
      dateFormattedB: '',
      axisWidth: '',
      selectedDate: '',
      changeDate: '',
      timeScale: '',
      incrementDate: '',
      timeScaleChangeUnit: '',
      changeAmt: '',
      intervalText: '',
      customIntervalValue: '',
      customIntervalZoomLevel: '',
      customIntervalText: '',
      hasSubdailyLayers: '',
      customIntervalModalOpen: false,
      inputChange: false,
      timelineHidden: false,
    };
  }

  // updateDate = (date, inputChange) => {
  updateDate = (date, selectionStr) => {
    console.log(date, selectionStr)
    // if (inputChange) {
    //   this.setState({
    //     inputChange: true
    //   }, this.props.updateDate(date));
    // } else {
      this.props.updateDate(date, selectionStr);
    // }

  }

  resetInput = () => {
    this.setState({
      inputChange: false
    });
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
      // this.setState({
      //   timeScale: timeScale
      // });
      this.props.changeTimeScale(timeScale);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    console.log(this.state.dateFormatted, prevState.dateFormatted)
    // if(this.state.dateFormatted !== prevState.dateFormatted) {
    //   this.setState({
    //     dateFormatted: this.props.dateFormatted
    //   })
    // }
  }

  componentDidMount() {
    this.init();
  }

  init = () => {
    let timeScaleChangeUnitString = `${this.props.intervalDelta} ${timeUnitAbbreviations[this.props.intervalTimeScale]}`;
    this.setState({
      dateFormatted: this.props.selectedDate.toISOString(),
      dateFormattedB: this.props.selectedDateB ? this.props.selectedDateB.toISOString() : null,
      draggerSelected: this.props.draggerSelected,
      // draggerSelectedB: this.props.draggerSelectedB,
      axisWidth: this.props.axisWidth,
      selectedDate: this.props.selectedDate.toISOString(),
      changeDate: this.props.changeDate,
      timeScale: this.props.timeScale,
      incrementDate: this.props.incrementDate,
      timeScaleChangeUnit: this.props.intervalTimeScale,
      changeAmt: this.props.intervalDelta,
      customIntervalValue: this.props.intervalDelta,
      customIntervalZoomLevel: this.props.intervalTimeScale,
      hasSubdailyLayers: this.props.hasSubdailyLayers,
      intervalText: this.props.timeScale,
      compareModeActive: this.props.compareModeActive
    });
  }

  setInterval = (intervalValue, zoomLevel) => {
    // this.setState({
    //   customIntervalValue: intervalValue,
    //   customIntervalZoomLevel: zoomLevel
    // }, this.props.setIntervalInput(intervalValue, zoomLevel));
    this.props.setIntervalInput(intervalValue, zoomLevel);
  }

  setIntervalChangeUnit = (intervalValue, zoomLevel) => {

    let timeScaleChangeUnitString = `${intervalValue} ${timeUnitAbbreviations[zoomLevel]}`;

      this.setState({
        customIntervalText: timeScaleChangeUnitString,
        intervalText: timeScaleChangeUnitString,
        customIntervalValue: intervalValue,
        customIntervalZoomLevel: zoomLevel,
        changeAmt: intervalValue,
        timeScaleChangeUnit: zoomLevel
      }, this.props.setIntervalInput(intervalValue, zoomLevel))
  }

  setTimeScaleIntervalChangeUnit = (customIntervalChangeUnit) => {
    if (customIntervalChangeUnit === 'custom') {
      this.setState({
        intervalText: this.state.customIntervalText ? this.state.customIntervalText : 'Custom',
        changeAmt: this.state.customIntervalValue ? this.state.customIntervalValue : 1,
        timeScaleChangeUnit: this.state.customIntervalZoomLevel ? this.state.customIntervalZoomLevel : this.state.timeScale
      })
    } else {
      this.setState({
        intervalText: customIntervalChangeUnit,
        changeAmt: 1,
        timeScaleChangeUnit: customIntervalChangeUnit
      })
    }
  }
  // left/right arrows increment date
  incrementDate = (multiplier) => {
    let newDate = moment.utc(this.state.dateFormatted).add((multiplier * this.state.changeAmt), this.state.timeScaleChangeUnit)

    // this.props.incrementDate((multiplier * this.state.changeAmt), this.state.timeScaleChangeUnit);
    this.updateDate(new Date(newDate.format()));
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

  shouldComponentUpdate(nextProps, nextState) {
    // console.log(this.props, nextProps, this.state, nextState)
    // if (this.state.inputChange) {
    //   this.setState({
    //     inputChange: false
    //   })
    //   return false;
    // }
    return true;
  }

  render() {
    console.log(this.props.selectedDate, this.props.dateFormatted, this.state.dateFormatted, this.props)
    console.log(this.state)
    console.log(this.props.hasSubdailyLayers, this.state.hasSubdailyLayers)
    console.log(this.props)
    console.log(this.props.draggerSelected)
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
              // draggerSelectedB={this.state.draggerSelectedB}
            />
          </div>
          <div id="zoom-buttons-group">
            <TimeScaleIntervalChange
              setTimeScaleIntervalChangeUnit={this.setTimeScaleIntervalChangeUnit}
              intervalText={this.state.intervalText}
              customIntervalText={this.state.customIntervalText}
            />

            {/* custom interval selector */}
            <IntervalSelectorWidget
              setInterval={this.setInterval}
              customIntervalValue={this.state.customIntervalValue}
              customIntervalZoomLevel={this.state.customIntervalZoomLevel}
              toggleCustomIntervalModal={this.toggleCustomIntervalModal}
              customIntervalModalOpen={this.state.customIntervalModalOpen}
              setIntervalChangeUnit={this.setIntervalChangeUnit}
              hasSubdailyLayers={this.state.hasSubdailyLayers}
            />

            <DateChangeArrows
              leftArrowDown={() => this.incrementDate(-1)}
              leftArrowUp={this.props.stopper}
              rightArrowDown={() => this.incrementDate(1)}
              rightArrowUp={this.props.stopper}
            />
          </div>

          <AnimationButton
            clickAnimationButton={this.clickAnimationButton}
          />
        </div>
        <div id="timeline-footer">
          <div id="wv-animation-widet-case"> </div>
          {/* <svg width="1207" height="107" id="timeline-footer-svg" viewBox="0 9 1207 91"> */}
          {/* new modular version - currently a shell */}
            <TimelineAxisContainer
              {...this.state}
              axisWidth={this.state.axisWidth}
              selectedDate={this.state.dateFormatted}
              selectedDateB={this.state.dateFormattedB}
              updateDate={this.updateDate}
              subdaily={this.props.subdaily}
              parentOffset={this.props.parentOffset}
              resetInput={this.resetInput}
              changeTimescale={this.changeTimescale}
              compareModeActive={this.state.compareModeActive}
              draggerSelected={this.state.draggerSelected}
              // draggerSelectedB={this.state.draggerSelectedB}
              onChangeSelectedDragger={this.props.onChangeSelectedDragger}
            />
            {/* </svg> */}
        </div>

        {/* hammmmmmmmmmmburger 🍔 */}
        <div className="zoom-level-change" style={{ width: '75px', display: this.state.timelineHidden ? 'none' : 'block'}}>
          <AxisTimeScaleChange
          timeScale={this.state.timeScale}
          changeTimescale={this.changeTimescale}
          hasSubdailyLayers={this.state.hasSubdailyLayers}
          />
        </div>

        <div id="timeline-hide" onClick={this.toggleHideTimeline}>
          {this.state.timelineHidden ?
          <i className="fas fa-chevron-right wv-timeline-hide-arrow"></i>
          :
          <i className="fas fa-chevron-left wv-timeline-hide-arrow"></i>
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
