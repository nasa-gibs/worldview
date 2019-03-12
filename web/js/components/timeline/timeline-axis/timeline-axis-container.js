import React from 'react';
import PropTypes from 'prop-types';
import TimelineAxis from './timeline-axis';
import TimelineDragger from './timeline-dragger';

class TimelineAxisContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    return (
      <React.Fragment>
        <TimelineAxis width={this.props.width} />
        <TimelineDragger />
      </React.Fragment>
    );
  };
}

TimelineAxisContainer.defaultProps = {
};
TimelineAxisContainer.propTypes = {
};

export default TimelineAxisContainer;
