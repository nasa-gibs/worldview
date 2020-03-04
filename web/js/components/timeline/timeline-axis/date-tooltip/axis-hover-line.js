import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * AxisHoverLine for axis hover
 *
 * @class AxisHoverLine
 * @extends PureComponent
 */
class AxisHoverLine extends PureComponent {
  render() {
    const {
      axisWidth,
      isTimelineDragging,
      isAnimationDraggerDragging,
      showHoverLine,
      hoverLinePosition,
    } = this.props;
    // check for timeline/animation dragging and showhover handled by parent
    const showHover = !isTimelineDragging && !isAnimationDraggerDragging && showHoverLine;
    return (
      showHover
        ? (
          <svg className="axis-hover-line-container" width={axisWidth} height={63}>
            <line
              className="axis-hover-line"
              stroke="#0f51c0"
              strokeWidth="2"
              x1="0"
              x2="0"
              y1="0"
              y2="63"
              transform={`translate(${hoverLinePosition + 1}, 0)`}
            />
          </svg>
        )
        : null
    );
  }
}

AxisHoverLine.propTypes = {
  axisWidth: PropTypes.number,
  hoverLinePosition: PropTypes.number,
  isAnimationDraggerDragging: PropTypes.bool,
  isTimelineDragging: PropTypes.bool,
  showHoverLine: PropTypes.bool,
};

export default AxisHoverLine;
