import React from 'react';
import PropTypes from 'prop-types';
import util from '../../util/util';
/*
 * A react component, Builds a SVG line who's dimensions and styles
 * are customizable
 *
 * @class Line
 * @extends React.Component
 */
class Line extends React.Component {
  /*
   * Sets state and extents props
   */
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
      height: props.height,
      active: true,
    };
  }

  /*
   * Updates state on svg hover
   *
   * return {Void}
   */
  mouseOver() {
    this.setState({
      hovered: true,
    });
  }

  /*
   * Updates state on svg mouseout
   *
   * return {Void}
   */
  mouseOut() {
    this.setState({
      hovered: false,
    });
  }

  /*
   * Runs lineOver props method when
   * the invisible line is hovered, passing
   * event properties
   *
   * @param {Object} e - React event object
   * return {Void}
   */
  mouseOverHidden(e) {
    this.props.lineOver(
      [e.clientX, e.clientY],
      this.props.overlay,
      this.props.lineX,
      this.props.tooltip,
    );
  }

  /*
   * Runs lineOut props method when
   * the invisible line is not longer hovered, passing
   * the react component to deactivate
   *
   * return {Void}
   */
  mouseOutHidden() {
    this.props.lineOut(this.props.tooltip);
  }

  render() {
    return (
      <svg
        onMouseOver={this.mouseOver.bind(this)}
        onMouseOut={this.mouseOut.bind(this)}
        style={this.props.svgStyle}
        width={this.props.width}
        id={this.props.id}
        height={this.state.height}
        className={this.props.classes}
      >
        <line
          strokeWidth={this.props.strokeWidth}
          stroke={this.props.color}
          opacity={
            (this.state.hovered && this.state.active)
            || (this.state.active && util.browser.mobileAndTabletDevice)
              ? this.props.opacity
              : '0'
          }
          x1={this.props.strokeWidth / 2}
          x2={this.props.strokeWidth / 2}
          strokeDasharray={this.props.dashArray}
          y2={this.state.height}
          y1="0"
        />
        <line
          className="dateline-hidden"
          onMouseOver={this.mouseOverHidden.bind(this)}
          onMouseMove={this.mouseOverHidden.bind(this)}
          onMouseOut={this.mouseOutHidden.bind(this)}
          style={this.props.style}
          opacity="0"
          x1={this.props.strokeWidth / 2}
          x2={this.props.strokeWidth / 2}
          strokeWidth={this.props.strokeWidth}
          stroke={this.props.color}
          y1="0"
          y2={this.state.height}
        />
      </svg>
    );
  }
}
Line.defaultProps = {
  dashArray: '5, 10',
  opacity: '0.5',
  width: '10',
  strokeWidth: '6',
  color: 'white',
  height: 200,
  svgStyle: {
    margin: '0 40px 0 40px',
    transform: 'translateX(-43px)',
  },
};

Line.propTypes = {
  classes: PropTypes.string,
  color: PropTypes.string,
  dashArray: PropTypes.string,
  height: PropTypes.number,
  id: PropTypes.string,
  lineOut: PropTypes.func,
  lineOver: PropTypes.func,
  lineX: PropTypes.number,
  opacity: PropTypes.string,
  overlay: PropTypes.object,
  strokeWidth: PropTypes.string,
  style: PropTypes.object,
  svgStyle: PropTypes.object,
  tooltip: PropTypes.object,
  width: PropTypes.string,
};

export default Line;
