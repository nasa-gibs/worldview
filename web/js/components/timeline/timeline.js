import React from 'react';
import PropTypes from 'prop-types';
import './timeline.css';
import TimelineAxis from './timeline-axis';

class Timeline extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: this.props.width,
      selectedDate: this.props.selectedDate,
      changeDate: this.props.changeDate,
      timeScale: this.props.timeScale,
      incrementDate: this.props.incrementDate
    };
  }

  render() {
    let dateFormatted = this.state.selectedDate.toISOString();
    return (
      <div>
        <TimelineAxis {...this.state} selectedDate={dateFormatted}/>
      </div>
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
