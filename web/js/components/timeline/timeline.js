import React from 'react';
import PropTypes from 'prop-types';

import DateChangeControls from './timeline-controls/date-change-controls';
import './timeline.css';
// import TimelineAxis from './timeline-axis';
import TimelineAxisContainer from './timeline-axis/timeline-axis-container';

class Timeline extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: this.props.width,
      selectedDate: this.props.selectedDate,
      changeDate: this.props.changeDate,
      timeScale: this.props.timeScale,
      incrementDate: this.props.incrementDate,
      timeScaleChangeUnit: this.props.timeScaleChangeUnit,
      changeAmt: 1,
    };
  }

  dateChange = (date, id, type, amt) => {
    this.setState({
      selectedDate: date,
      timeScaleChangeUnit: type,
      changeAmt: amt
    })
  }

  render() {
    let dateFormatted = this.state.selectedDate.toISOString();
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

    console.log(this.props)
    return (
      <React.Fragment>
        <DateChangeControls selectedDate={dateFormatted} dateChange={this.dateChange} />
        {/* <TimelineAxis {...this.state} selectedDate={dateFormatted}/> */}

        {/* new modular version - currently a shell */}
        <TimelineAxisContainer {...this.state} selectedDate={dateFormatted}/>

        {/* hammmmmmmmmmmburger 🍔 */}
        {/* <div id="timeline-hide">
          <svg className="hamburger" width="10" height="9">
            <path d="M 0,0 0,1 10,1 10,0 0,0 z M 0,4 0,5 10,5 10,4 0,4 z M 0,8 0,9 10,9 10,8 0,8 z" />
          </svg>
        </div> */}
      </React.Fragment>
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
