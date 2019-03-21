import React from 'react';
import PropTypes from 'prop-types';

import DateChangeControls from './timeline-controls/date-change-controls';
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
      timeScaleChangeUnit: this.props.timeScaleChangeUnit,
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

  shouldComponentUpdate(nextProps, nextState) {
    // console.log(this.props, nextProps, this.state, nextState)
    return true;
  }

  render() {
    // console.log(this.props.selectedDate, this.state.dateFormatted)
    // let dateFormatted = this.state.selectedDate.toISOString();
    // let tempStyle = {
    //   position: 'absolute',
    //   border: '1px solid #333',
    //   background: 'rgba(40, 40, 40, 0.9)',
    //   borderRadius: '5px',
    //   display: 'flex',
    //   flexFlow: 'row nowrap',
    //   marginLeft: '10px',
    //   marginRight: '10px',
    //   height: '67px',
    //   bottom: '10px'
    // }

    // console.log(this.props)
    // console.log('DATE', dateFormatted)


    return (
      this.state.dateFormatted ?
      <React.Fragment>
        {/* <DateChangeControls
          toggleCustomIntervalModal={this.toggleCustomIntervalModal}
          selectedDate={this.state.dateFormatted}
          dateChange={this.updateDate} /> */}
        {/* <TimelineAxis {...this.state} selectedDate={dateFormatted}/> */}

        {/* new modular version - currently a shell */}
        <TimelineAxisContainer {...this.state} selectedDate={this.state.dateFormatted} updateDate={this.updateDate} />

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
