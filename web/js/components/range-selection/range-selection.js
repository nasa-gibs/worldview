import React from 'react';
import PropTypes from 'prop-types';
import Dragger from './dragger.js';
import DraggerRange from './dragger-range.js';
import googleTagManager from 'googleTagManager';

/*
 * A react component, is a draggable svg
 * group. It is a parent component that
 * rerenders when child elements are dragged
 *
 * @class TimelineRangeSelector
 */
class TimelineRangeSelector extends React.Component {
  /*
   * @constructor
   */
  constructor(props) {
    super(props);
    this.state = {
      startLocation: props.startLocation,
      endLocation: props.endLocation,
      startLocationDate: props.startLocationDate,
      endLocationDate: props.endLocationDate,
      max: props.max,
      deltaStart: 0
    };
  }
  componentWillReceiveProps(props) {
    this.setState({
      startLocation: props.startLocation,
      endLocation: props.endLocation,
      startLocationDate: props.startLocationDate,
      endLocationDate: props.endLocationDate,
      max: props.max
    });
  }
  /*
   * When a child component is dragged,
   * this function is called to determine
   * the correct location for each of the
   * child elements after the drag
   *
   * @method handleDrag
   *
   * @param {number} deltaX - change in x
   * @param {string} id - Identifier used to
   *  distinguish between the child elements
   *
   * @return {void}
   */
  onItemDrag(deltaX, id) {
    var startX;
    var endX;

    if (id === 'start') {
      startX = deltaX + this.state.startLocation;
      endX = this.state.endLocation;
      if (startX < 0 || startX > endX) {
        return;
      }
      if (startX + this.props.pinWidth >= endX) {
        if (startX + this.props.pinWidth >= this.state.max.width) {
          return;
        } else {
          endX = startX + this.props.pinWidth;
        }
      }
    } else if (id === 'end') {
      startX = this.state.startLocation;
      endX = deltaX + this.state.endLocation;
      if (endX > this.state.max.width || startX > endX) {
        return;
      }
      if (startX + 2 * this.props.pinWidth >= endX) {
        startX = endX - this.props.pinWidth;
      }
    } else {
      startX = deltaX + this.state.startLocation;
      endX = deltaX + this.state.endLocation;
      if (endX >= this.state.max.width || startX < 0) {
        return;
      }
    }
    this.props.onDrag(startX, endX);

    this.setState({
      startLocation: startX,
      endLocation: endX
    });
  }
  /*
   * Send callback with new locations on
   * Drag Stop
   *
   * @method onDragStop
   *
   * @return {void}
   */
  onDragStop() {
    this.props.onDrag(this.state.startLocation, this.state.endLocation);
    googleTagManager.pushEvent({
      'event': 'GIF_animation_dragger'
    });
  }
  /*
  * Send callback with click event
  *
  * @method onRangeClick
  *
  * @param {object} d - proxy click event object
  *
  * @return {void}
  */
  onRangeClick(e) {
    this.props.onRangeClick(e.nativeEvent);
  }
  /*
   * Update state based on distance range was dragged
   *
   * @method onRangeDrag
   *
   * @param {number} d - change in x
   * @param {number} deltaStart - delta start to track changes
   *
   * @return {void}
   */
  onRangeDrag(d, deltaStart) {
    this.setState({
      startLocation: this.state.startLocation + d,
      endLocation: this.state.endLocation + d,
      deltaStart: deltaStart
    });
    this.props.onDrag(this.state.startLocation, this.state.endLocation);
  }
  /*
   * @method render
   */
  render() {
    return (
      <svg id="wv-timeline-range-selector" className="wv-timeline-range-selector">
        <DraggerRange
          opacity={this.props.rangeOpacity}
          startLocation={this.state.startLocation}
          endLocation={this.state.endLocation}
          startLocationDate={this.state.startLocationDate}
          endLocationDate={this.state.endLocationDate}
          timelineStartDateLimit={this.props.timelineStartDateLimit}
          timelineEndDateLimit={this.props.timelineEndDateLimit}
          deltaStart={this.state.deltaStart}
          max={this.state.max}
          height={this.props.height}
          width={this.props.pinWidth}
          color={this.props.rangeColor}
          draggerID='range-selector-range'
          onClick={this.onRangeClick.bind(this)}
          onDrag={this.onRangeDrag.bind(this)}
          onStop={this.onDragStop.bind(this)}
          id='range'/>
        <Dragger
          position={this.state.startLocation}
          color={this.props.startColor}
          width={this.props.pinWidth}
          height={this.props.height}
          onDrag={this.onItemDrag.bind(this)}
          onStop={this.onDragStop.bind(this)}
          max={this.state.max.width}
          draggerID='range-selector-dragger-1'
          backgroundColor={this.props.startTriangleColor}
          first={true}
          id='start' />
        <Dragger
          max={this.state.max.width}
          position={this.state.endLocation}
          color={this.props.endColor}
          width={this.props.pinWidth}
          height={this.props.height}
          first={false}
          draggerID='range-selector-dragger-2'
          onDrag={this.onItemDrag.bind(this)}
          onStop={this.onDragStop.bind(this)}
          backgroundColor={this.props.endTriangleColor}
          id='end'/>
      </svg>
    );
  }
}

TimelineRangeSelector.propTypes = {
  startLocation: PropTypes.number,
  endLocation: PropTypes.number,
  startLocationDate: PropTypes.string,
  endLocationDate: PropTypes.string,
  timelineStartDateLimit: PropTypes.string,
  timelineEndDateLimit: PropTypes.string,
  max: PropTypes.object,
  pinWidth: PropTypes.number,
  height: PropTypes.number,
  onDrag: PropTypes.func,
  onRangeClick: PropTypes.func,
  rangeOpacity: PropTypes.number,
  rangeColor: PropTypes.string,
  startColor: PropTypes.string,
  startTriangleColor: PropTypes.string,
  endColor: PropTypes.string,
  endTriangleColor: PropTypes.string
};

export default TimelineRangeSelector;
