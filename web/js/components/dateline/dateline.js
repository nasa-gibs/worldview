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
      height: 0,
      active: true,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { active, height, hovered } = this.state;
    const checkForStateUpdates = nextState.active === active
      && nextState.height === height
      && nextState.hovered === hovered;

    if (checkForStateUpdates) {
      return false;
    }
    return true;
  }

  /*
   * Updates state on svg hover
   *
   * return {Void}
   */
  mouseOver = () => {
    this.setState({
      hovered: true,
    });
  }

  /*
   * Updates state on svg mouseout
   *
   * return {Void}
   */
  mouseOut = () => {
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
  mouseOverHidden = (e) => {
    const {
      lineOver, overlay, lineX, tooltip,
    } = this.props;
    lineOver(
      [e.clientX, e.clientY],
      overlay,
      lineX,
      tooltip,
    );
  }

  /*
   * Runs lineOut props method when
   * the invisible line is not longer hovered, passing
   * the react component to deactivate
   *
   * return {Void}
   */
  mouseOutHidden = () => {
    const { lineOut, tooltip } = this.props;
    lineOut(tooltip);
  }

  render() {
    const {
      id,
      svgStyle,
      width,
      style,
      classes,
      color,
      strokeWidth,
      opacity,
      dashArray,
    } = this.props;
    const { height, active, hovered } = this.state;
    return (
      <svg
        onMouseOver={this.mouseOver}
        onMouseOut={this.mouseOut}
        style={svgStyle}
        width={width}
        id={id}
        height={height}
        className={classes}
      >
        <line
          strokeWidth={strokeWidth}
          stroke={color}
          opacity={
            (hovered && active)
            || (active && util.browser.mobileAndTabletDevice)
              ? opacity
              : '0'
          }
          x1={strokeWidth / 2}
          x2={strokeWidth / 2}
          strokeDasharray={dashArray}
          y2={height}
          y1="0"
        />
        <line
          className="dateline-hidden"
          onMouseOver={this.mouseOverHidden}
          onMouseMove={this.mouseOverHidden}
          onMouseOut={this.mouseOutHidden}
          style={style}
          opacity="0"
          x1={strokeWidth / 2}
          x2={strokeWidth / 2}
          strokeWidth={strokeWidth}
          stroke={color}
          y1="0"
          y2={height}
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
  svgStyle: {
    margin: '0 40px 0 40px',
    transform: 'translateX(-43px)',
  },
};

Line.propTypes = {
  classes: PropTypes.string,
  color: PropTypes.string,
  dashArray: PropTypes.string,
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
