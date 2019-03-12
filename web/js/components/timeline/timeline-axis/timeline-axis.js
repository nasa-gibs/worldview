import React from 'react';
import PropTypes from 'prop-types';
import GridRange from './grid-range/grid-range';

class TimelineAxis extends React.Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    return (
      <React.Fragment>
        <GridRange />
      </React.Fragment>
    );
  };
}

TimelineAxis.defaultProps = {
};
TimelineAxis.propTypes = {
};

export default TimelineAxis;
