import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

// VARIABLE TYPE
// model.activeDate
// tl.width


// FUNCTION TYPE
// d3.event.x
// tl.x.invert(tempPickTipOffset)

class TimelineDragger extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      position: props.position
    };
  }

  getDefaultDragger() {
    return (
      <React.Fragment>
        <g style={{cursor: 'pointer'}} id="draggerHandle">
          {/* <path id="cow" fill="#ccc" stroke="#515151" d="M 7.3151,0.7426 C 3.5507,0.7426 0.5,3.7926 0.5,7.5553 l 0,21.2724 14.6038,15.7112 14.6039,15.7111 14.6038,-15.7111 14.6037,-15.7112 0,-21.2724 c 0,-3.7627 -3.051,-6.8127 -6.8151,-6.8127 l -44.785,0 z"></path> */}
          <polygon fill="#ccc" stroke="#515151" points="50,25, 90,90, 10,90"></polygon>
          <rect fill="#515151" width="4" height="20" x="41" y="55"></rect>
          <rect fill="#515151" width="4" height="20" x="48" y="55"></rect>
          <rect fill="#515151" width="4" height="20" x="55" y="55"></rect>
        </g>
      </React.Fragment>
    );
  }

  render() {
    return (
      <Draggable
        handle="#draggerHandle"
        position={{ x: 500, y: 0 }}
        axis="x"
      >
        <svg 
        id="guitarpickX">
          {this.getDefaultDragger()}
        </svg>
      </Draggable>
    );
  };
}

TimelineDragger.defaultProps = {
};
TimelineDragger.propTypes = {
};

export default TimelineDragger;
