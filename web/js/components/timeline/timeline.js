import React from 'react';
import PropTypes from 'prop-types';

import DateChangeControls from './timeline-controls/date-change-controls';
import DateZoomChange from './timeline-controls/date-zoom-change';
import './timeline.css';
// import TimelineAxis from './timeline-axis';
import TimelineAxisContainer from './timeline-axis/timeline-axis-container';
import IntervalSelectorWidget from './interval-selector/interval-selector';

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
      customIntervalModalOpen: false
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

  updateDate = (date) => {
    // console.log(date)
    this.props.updateDate(date);
    let dateFormatted = new Date(date).toISOString();
    // this.setState({
    //   selectedDate: dateFormatted,
    //   dateFormatted: dateFormatted
    // })
  }

  toggleCustomIntervalModal = () => {
    this.setState(prevState => ({
      customIntervalModalOpen: !prevState.customIntervalModalOpen
    }))
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
    })
  }

  setInterval = (intervalValue, zoomLevel) => {
    this.setState({
      customIntervalValue: intervalValue,
      customIntervalZoomLevel: zoomLevel
    }, this.props.setIntervalInput(intervalValue, zoomLevel))
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

  shouldComponentUpdate(nextProps, nextState) {
    // console.log(this.props, nextProps, this.state, nextState)
    return true;
  }

  render() {
    console.log(this.props.selectedDate, this.props.dateFormatted, this.state.dateFormatted, this.props)

    return (
      this.state.dateFormatted ?
      <React.Fragment>
          <div id="timeline-header">
            <div id="date-selector-main" />
            <div id="zoom-buttons-group">
              {/* <div id="zoom-btn-container"> */}

                <DateZoomChange timeScaleChangeUnit={this.state.timeScaleChangeUnit} setTimeScale={this.setTimeScale} />
              
              {/* </div> */}
        {/* <DateChangeControls
          toggleCustomIntervalModal={this.toggleCustomIntervalModal}
          selectedDate={this.state.dateFormatted}
          dateChange={this.updateDate} /> */}
        {/* <TimelineAxis {...this.state} selectedDate={dateFormatted}/> */}

        

        {/* custom interval selector */}
        <IntervalSelectorWidget
          setInterval={this.setInterval}
          customIntervalValue={1}
          customIntervalZoomLevel={this.props.timeScale}
          toggleCustomIntervalModal={this.toggleCustomIntervalModal}
          customIntervalModalOpen={this.state.customIntervalModalOpen} />

        {/* hammmmmmmmmmmburger 🍔 */}
        {/* <div id="timeline-hide">
          <svg className="hamburger" width="10" height="9">
            <path d="M 0,0 0,1 10,1 10,0 0,0 z M 0,4 0,5 10,5 10,4 0,4 z M 0,8 0,9 10,9 10,8 0,8 z" />
          </svg>
        </div> */}

              <div
                className="button-action-group"
                id="left-arrow-group"
                title="Click and hold to animate backwards"
              >
                <svg id="timeline-svg" width="24" height="30">
                  <path
                    d="M 10.240764,0 24,15 10.240764,30 0,30 13.759236,15 0,0 10.240764,0 z"
                    className="arrow"
                  />
                </svg>
              </div>
              <div
                className="button-action-group"
                id="right-arrow-group"
                title="Click and hold to animate forwards"
              >
                <svg width="24" height="30">
                  <path
                    d="M 10.240764,0 24,15 10.240764,30 0,30 13.759236,15 0,0 10.240764,0 z"
                    className="arrow"
                  />
                </svg>
              </div>
            </div>
            <div
              className="button-action-group animate-button"
              id="animate-button"
              title="Set up animation"
            >
              <i id="wv-animate" className="fas fa-video wv-animate" />
            </div>
          </div>
          <div id="timeline-footer">
            <div id="wv-animation-widet-case"> </div>
            {/* <svg width="1207" height="107" id="timeline-footer-svg" viewBox="0 9 1207 91"> */}
            {/* new modular version - currently a shell */}
              <TimelineAxisContainer {...this.state} selectedDate={this.state.dateFormatted} updateDate={this.updateDate} subdaily={this.props.subdaily} />
              {/* </svg> */}
          </div>
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
