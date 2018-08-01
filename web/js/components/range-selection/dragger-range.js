import React from 'react';
import PropTypes from 'prop-types';
/*
 * A react component, is a draggable svg
 * rect element
 *
 * @class TimelineDraggerRange
 */
class TimelineDraggerRange extends React.Component {
  /*
   * @constructor
   */
  constructor(props) {
    super(props);
    this.opacity = {
      fillOpacity: this.props.opacity
    };
  }
  checkWidth() {
    var start = this.props.startLocation;
    var end = this.props.endLocation;
    var max = this.props.max;
    var width;

    if (start < 0) {
      start = 0;
    }
    if (end > max) {
      end = max;
    }
    width = end - start;
    if (width < 0) {
      width = 0;
    }
    this.state = {
      width: width,
      startLocation: start
    };
  }
  /*
   * When the component is dragged,
   * this function passes the id
   * and change in x of the drag
   * to onDrag property
   *
   * @method handleDrag
   *
   * @return {void}
   */
  handleDrag(e, d) {
    e.stopPropagation();
    this.props.onDrag(d.deltaX);
  }

  /*
   * @method render
   */
  render() {
    this.checkWidth();
    return (
      <rect
        x={this.state.startLocation}
        fill={this.props.color}
        width={this.state.width}
        style={this.opacity}
        height={this.props.height}
        className='dragger-range'
        onClick={this.props.onClick}
      />
    );
  }
}

TimelineDraggerRange.propTypes = {
  opacity: PropTypes.number,
  startLocation: PropTypes.number,
  endLocation: PropTypes.number,
  max: PropTypes.number,
  height: PropTypes.number,
  onDrag: PropTypes.func,
  onClick: PropTypes.func,
  color: PropTypes.string
};

export default TimelineDraggerRange;
