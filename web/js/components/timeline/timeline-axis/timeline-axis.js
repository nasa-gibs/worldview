import React from 'react';
import PropTypes from 'prop-types';
import TimelineScale from './timeline-scale';
import TimelineDragger from './timeline-dragger';
import TimelineDateDialog from './timeline-date-dialog';

class TimelineAxis extends React.Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  onHoverx() {
    console.log('hovered');
  }

  render() {
    return (
      <React.Fragment>
        <TimelineScale width={this.props.width} />
        <TimelineDragger />
      </React.Fragment>
    );
  };
}

TimelineAxis.defaultProps = {
};
TimelineAxis.propTypes = {
};

export default TimelineAxis;
