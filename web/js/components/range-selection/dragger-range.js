import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
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
    this.state = {
      width: 0,
      startLocation: this.props.startLocation,
      endLocation: this.props.endLocation,
      previousStartLocation: this.props.startLocation
    };
  }
  /*
  * Resize timeline dragger width
  *
  * @method checkWidth
  *
  * @return {void}
  */
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
    this.setState({
      width: width,
      startLocation: start
    });
  }
  /*
   * When the component is dragged,
   * this function passes the id
   * and change in x of the drag
   * to onDrag property
   *
   * @method handleDrag
   *
   * @param {object} e - event object
   * @param {object} d - Draggable object
   *
   * @return {void}
   */
  handleDrag(e, d) {
    e.preventDefault();
    e.stopPropagation();
    // +/- {number} - change in x - set to 0 to 'stop' dragger movement
    let deltaX = d.deltaX;
    // +/- {number} - start position
    let deltaStart = d.x;

    // timeline dragger dragged into the future (to the right)
    if (deltaX > 0) {
      // timeline dragger dragged to max future of current viewable timeline
      if (this.props.endLocation >= this.props.max) {
        deltaX = 0;
      }
      if (this.props.endLocation > this.props.max - deltaX) {
        deltaX = 0;
      }
    // timeline dragger dragged into the past (to the left)
    } else {
      // timeline dragger dragged to min past of current viewable timeline
      if (this.props.startLocation + deltaX <= 0) {
        deltaX = 0;
      }
    }
    this.props.onDrag(deltaX, deltaStart, this.props.id);
  }

  /*
  * Handle dragging timeline and syncing start position of dragger range
  * used in rect to return x
  *
  * @method handleStartPositionRestriction
  *
  * @return {number}
  */
  handleStartPositionRestriction() {
    // if startLocation is in the past prior to min past of current viewable timeline
    if (this.props.startLocation <= 0) {
      return -this.props.deltaStart;
    } else {
      return this.props.startLocation - this.props.deltaStart;
    }
  }

  /*
  * Handle click within dragger range for drag vs guitarpick click behavior
  * used in rect as onClick
  *
  * @method handleDraggerClick
  *
  * @return {void}
  */
  handleDraggerClick(e) {
    // compare start locations to check if range has been dragged vs. clicked
    if (this.state.startLocation.toFixed(3) === this.state.previousStartLocation.toFixed(3)) {
      this.props.onClick(e);
    } else {
      this.setState({ previousStartLocation: this.state.startLocation });
    }
  }

  componentDidMount () {
    this.checkWidth();
  }

  // update state - used in componentDidUpdate
  updateExtent(nextProps) {
    this.setState({
      startLocation: nextProps.startLocation,
      endLocation: nextProps.endLocation
    });
  }

  componentDidUpdate (prevProps) {
    // update state and checkWidth only on startLocation and/or endLocation changes
    if (prevProps.startLocation !== this.props.startLocation || prevProps.endLocation !== this.props.endLocation) {
      this.updateExtent(this.props);
      this.checkWidth();
    }
  }
  /*
   * @method render
   */
  render() {
    return (
      <Draggable
        handle=".dragger-range"
        axis="x"
        position={null}
        defaultPosition={{ x: 0, y: 0 }}
        onStop={this.props.onStop}
        onDrag={this.handleDrag.bind(this)}
      >
        <rect
          x={this.handleStartPositionRestriction()}
          fill={this.props.color}
          width={this.state.width}
          style={{
            fillOpacity: this.props.opacity,
            cursor: 'pointer'
          }}
          height={this.props.height}
          className='dragger-range'
          id={this.props.draggerID}
          onClick={this.handleDraggerClick.bind(this)}
        />
      </Draggable>
    );
  }
}

TimelineDraggerRange.propTypes = {
  opacity: PropTypes.number,
  startLocation: PropTypes.number,
  endLocation: PropTypes.number,
  deltaStart: PropTypes.number,
  max: PropTypes.number,
  height: PropTypes.number,
  width: PropTypes.number,
  color: PropTypes.string,
  draggerID: PropTypes.string,
  onClick: PropTypes.func,
  onDrag: PropTypes.func,
  onStop: PropTypes.func,
  id: PropTypes.string
};

export default TimelineDraggerRange;
