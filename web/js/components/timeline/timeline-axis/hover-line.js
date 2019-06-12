import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * HoverLine for axis hover
 *
 * @class HoverLine
 * @extends PureComponent
 */
class HoverLine extends PureComponent {
  render() {
    let {
      width,
      isTimelineDragging,
      showHoverLine,
      hoverLinePosition
    } = this.props;
    return (
      !isTimelineDragging && showHoverLine
        ? <svg className='timeline-hover-line-container' width={width}>
          <line className='timeline-hover-line'
            stroke='blue' strokeWidth='2' strokeOpacity='0.48' x1='0' x2='0' y1='0' y2='63'
            transform={`translate(${hoverLinePosition + 1}, 0)`} shapeRendering='optimizeSpeed'
          />
        </svg>
        : null
    );
  }
}

HoverLine.propTypes = {
  isTimelineDragging: PropTypes.bool,
  showHoverLine: PropTypes.bool,
  hoverLinePosition: PropTypes.number
};

export default HoverLine;
