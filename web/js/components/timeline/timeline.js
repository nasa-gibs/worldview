import React from 'react';
import PropTypes from 'prop-types';

import DateChangeControls from './timeline-controls/date-change-controls';
import DateZoomChange from './timeline-controls/date-zoom-change';
import './timeline.css';
// import TimelineAxis from './timeline-axis';
import TimelineAxisContainer from './timeline-axis/timeline-axis-container';
import IntervalSelectorWidget from './interval-selector/interval-selector';

import DateSelector from '../date-selector/date-selector';
import DateChangeArrows from './timeline-controls/date-change-arrows';
import AnimationButton from './timeline-controls/animation-button';

import AxisZoomChange from './timeline-controls/axis-zoom-change';

class Timeline extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dateFormatted: '',
      timelineWidth: '',
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

  //# may not be necessary if incrementing doesn't matter for performance
  // dateChange = (date, id, type, amt) => {
  //   // console.log(date, id, type, amt)
  //   let dateFormatted = date.toISOString();
  //   console.log(dateFormatted)
  //   this.setState({
  //     selectedDate: date.toISOString(),
  //     timeScaleChangeUnit: type,
  //     changeAmt: amt,
  //     dateFormatted: dateFormatted
  //   })
  // }

  updateDate = (date, inputChange) => {
    console.log(date, inputChange)
    if (inputChange) {
      this.setState({
        inputChange: true
      }, this.props.updateDate(date));
    } else {
      this.props.updateDate(date);
    }

    // let dateFormatted = new Date(date).toISOString();
    // this.setState({
    //   selectedDate: dateFormatted,
    //   dateFormatted: dateFormatted
    // })
  }

  resetInput = () => {
    this.setState({
      inputChange: false
    });
  }

  toggleCustomIntervalModal = () => {
    this.setState(prevState => ({
      customIntervalModalOpen: !prevState.customIntervalModalOpen
    }));
  }

  // Change the timescale parent state
  changeTimescale = (timeScale) => {
    if (this.state.timeScale !== timeScale) {
      this.setState({
        timeScale: timeScale
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log('CDU', this.state, this.props)
  }

  componentDidMount() {
    this.init();
  }

  init = () => {
    this.setState({
      dateFormatted: this.props.selectedDate.toISOString(),
      timelineWidth: this.props.timelineWidth,
      selectedDate: this.props.selectedDate.toISOString(),
      changeDate: this.props.changeDate,
      timeScale: this.props.timeScale,
      incrementDate: this.props.incrementDate,
      timeScaleChangeUnit: this.props.timeScale,
      changeAmt: 1,
      customIntervalValue: 1,
      customIntervalZoomLevel: this.props.timeScale,
      hasSubdailyLayers: this.props.hasSubdailyLayers,
      intervalText: this.props.timeScale
    });
  }

  setInterval = (intervalValue, zoomLevel) => {
    this.setState({
      customIntervalValue: intervalValue,
      customIntervalZoomLevel: zoomLevel
    }, this.props.setIntervalInput(intervalValue, zoomLevel));
  }

  setIntervalChangeUnit = (intervalValue, zoomLevel) => {
    const timeUnitAbbreviations = {
      year: 'year',
      month: 'mon',
      day: 'day',
      hour: 'hour',
      minute: 'min'
    };

    let timeScaleChangeUnitString = `${intervalValue} ${timeUnitAbbreviations[zoomLevel]}`;

      this.setState({
        customIntervalText: timeScaleChangeUnitString,
        intervalText: timeScaleChangeUnitString,
        customIntervalValue: intervalValue,
        customIntervalZoomLevel: zoomLevel,
        changeAmt: intervalValue,
        timeScaleChangeUnit: zoomLevel
      })
  }

  setIntervalChangeUnitFromZoom = (customIntervalChangeUnit) => {
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
    console.log(this.state.changeAmt, this.state.timeScaleChangeUnit)
    this.props.incrementDate((multiplier * this.state.changeAmt), this.state.timeScaleChangeUnit);
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
    return (
      this.state.dateFormatted ?
      <React.Fragment>
        <div id="timeline-header" className={this.state.hasSubdailyLayers ? 'subdaily' : ''}>
          <div id="date-selector-main">
            <DateSelector
              {...this.props}
              onDateChange={this.updateDate}
              date={new Date(this.state.dateFormatted)}
              hasSubdailyLayers={this.state.hasSubdailyLayers}
            />
          </div>
          <div id="zoom-buttons-group">
            <DateZoomChange
              // timeScaleChangeUnit={this.state.timeScaleChangeUnit}
              setIntervalChangeUnitFromZoom={this.setIntervalChangeUnitFromZoom}
              intervalText={this.state.intervalText}
              customIntervalText={this.state.customIntervalText}
            />

            {/* </div> */}
            {/* <DateChangeControls
              toggleCustomIntervalModal={this.toggleCustomIntervalModal}
              selectedDate={this.state.dateFormatted}
              dateChange={this.updateDate} /> */}

            {/* custom interval selector */}
            <IntervalSelectorWidget
              setInterval={this.setInterval}
              customIntervalValue={1}
              customIntervalZoomLevel={this.props.timeScale}
              toggleCustomIntervalModal={this.toggleCustomIntervalModal}
              customIntervalModalOpen={this.state.customIntervalModalOpen}
              setIntervalChangeUnit={this.setIntervalChangeUnit}
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
              selectedDate={this.state.dateFormatted}
              updateDate={this.updateDate}
              subdaily={this.props.subdaily}
              parentOffset={this.props.parentOffset}
              resetInput={this.resetInput}
              changeTimescale={this.changeTimescale}
            />
            {/* </svg> */}
        </div>

        {/* hammmmmmmmmmmburger 🍔 */}
        {/* <div className="timeline-hamburger-date">DAY</div> */}
        <div className="zoom-level-change" style={{ width: '75px', display: this.state.timelineHidden ? 'none' : 'block'}}>
          <AxisZoomChange
          zoomLevel={this.state.timeScale}
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
          {/* <svg className="hamburger" width="10" height="9">
            <path d="M 0,0 0,1 10,1 10,0 0,0 z M 0,4 0,5 10,5 10,4 0,4 z M 0,8 0,9 10,9 10,8 0,8 z" />
          </svg> */}
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
