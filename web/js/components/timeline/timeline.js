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

class Timeline extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dateFormatted: '',
      width: '',
      selectedDate: '',
      changeDate: '',
      timeScale: '',
      incrementDate: '',
      timeScaleChangeUnit: '',
      changeAmt: '',
      customIntervalValue: '',
      customIntervalZoomLevel: '',
      customIntervalModalOpen: false,
      inputChange: false
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
    console.log(date)
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

  componentDidUpdate() {
    // console.log('CDU', this.state, this.props)
  }

  componentDidMount() {
    this.init();
  }

  init = () => {
    this.setState({
      dateFormatted: this.props.selectedDate.toISOString(),
      width: this.props.width,
      selectedDate: this.props.selectedDate.toISOString(),
      changeDate: this.props.changeDate,
      timeScale: this.props.timeScale,
      incrementDate: this.props.incrementDate,
      timeScaleChangeUnit: this.props.timeScale,
      changeAmt: 1,
      customIntervalValue: 1,
      customIntervalZoomLevel: this.props.timeScale
    });
  }

  setInterval = (intervalValue, zoomLevel) => {
    this.setState({
      customIntervalValue: intervalValue,
      customIntervalZoomLevel: zoomLevel
    }, this.props.setIntervalInput(intervalValue, zoomLevel));
  }

  setTimeScale = (timeScaleChangeUnit) => {

    if (timeScaleChangeUnit === 'custom') {
      console.log(timeScaleChangeUnit)
      // let toggle = this.state.customIntervalModalOpen;
      // console.log(toggle)
      // this.setState({
      //   customIntervalModalOpen: toggle
      // })
    } else {
      this.setState({
        timeScaleChangeUnit: timeScaleChangeUnit
      })
    }
  }

  // left/right arrows increment date
  incrementDate = (multiplier) => {
    this.props.incrementDate((multiplier * this.state.customIntervalValue), this.state.customIntervalZoomLevel);
  }

  // open animation dialog
  clickAnimationButton = () => {
    this.props.clickAnimationButton();
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
    return (
      this.state.dateFormatted ?
      <React.Fragment>
        <div id="timeline-header">
          <div id="date-selector-main">
            <DateSelector
              {...this.props.inputProps}
              onDateChange={this.updateDate}
              date={new Date(this.state.dateFormatted)}
            />
          </div>
          <div id="zoom-buttons-group">
            <DateZoomChange
              timeScaleChangeUnit={this.state.timeScaleChangeUnit}
              setTimeScale={this.setTimeScale}
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
            />
            {/* </svg> */}
        </div>

        {/* hammmmmmmmmmmburger 🍔 */}
        <div id="timeline-hide">
          <svg className="hamburger" width="10" height="9">
            <path d="M 0,0 0,1 10,1 10,0 0,0 z M 0,4 0,5 10,5 10,4 0,4 z M 0,8 0,9 10,9 10,8 0,8 z" />
          </svg>
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
