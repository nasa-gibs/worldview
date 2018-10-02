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
      max: props.max
    };
  }
  componentWillReceiveProps(props) {
    this.setState({
      startLocation: props.startLocation,
      endLocation: props.endLocation,
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
        if (startX + this.props.pinWidth >= this.state.max) {
          return;
        } else {
          endX = startX + this.props.pinWidth;
        }
      }
    } else if (id === 'end') {
      startX = this.state.startLocation;
      endX = deltaX + this.state.endLocation;
      if (endX > this.state.max || startX > endX) {
        return;
      }
      if (startX + 2 * this.props.pinWidth >= endX) {
        startX = endX - this.props.pinWidth;
      }
    } else {
      startX = deltaX + this.state.startLocation;
      endX = deltaX + this.state.endLocation;
      if (endX >= this.state.max || startX < 0) {
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
  onRangeClick(d) {
    this.props.onRangeClick(d.nativeEvent);
  }
  /*
   * @method render
   */
  render() {
    return (
      <svg
        id="wv-timeline-range-selector"
        className="wv-timeline-range-selector"
      >
        <DraggerRange
          width={this.props.pinWidth}
          endLocation={this.state.endLocation}
          opacity={this.props.rangeOpacity}
          color={this.props.rangeColor}
          height={this.props.height}
          startLocation={this.state.startLocation + this.props.pinWidth}
          onClick={this.onRangeClick.bind(this)}
          max={this.state.max}
          id="range"
        />
        <Dragger
          position={this.state.startLocation}
          color={this.props.startColor}
          width={this.props.pinWidth}
          height={this.props.height}
          onDrag={this.onItemDrag.bind(this)}
          onStop={this.onDragStop.bind(this)}
          max={this.state.max}
          draggerID="range-selector-dragger-1"
          backgroundColor={this.props.startTriangleColor}
          first={true}
          id="start"
        />
        <Dragger
          max={this.state.max}
          position={this.state.endLocation}
          color={this.props.endColor}
          width={this.props.pinWidth}
          height={this.props.height}
          first={false}
          draggerID="range-selector-dragger-2"
          onDrag={this.onItemDrag.bind(this)}
          onStop={this.onDragStop.bind(this)}
          backgroundColor={this.props.endTriangleColor}
          id="end"
        />
      </svg>
    );
  }
}

TimelineRangeSelector.propTypes = {
  startLocation: PropTypes.number,
  endLocation: PropTypes.number,
  max: PropTypes.number,
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
