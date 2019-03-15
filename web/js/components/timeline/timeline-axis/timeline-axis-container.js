import React from 'react';
import PropTypes from 'prop-types';
import TimelineAxis from './timeline-axis';
// import TimelineDragger from './timeline-dragger';

class TimelineAxisContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    // console.log(this.props)
    return (
      <React.Fragment>
        <TimelineAxis {...this.props} />

        {/* imported in TimelineAxis currently */}
        {/* <TimelineDragger />
        <TimelineDragger /> */}
      </React.Fragment>
    );
  };
}

TimelineAxisContainer.defaultProps = {
};
TimelineAxisContainer.propTypes = {
};

export default TimelineAxisContainer;
