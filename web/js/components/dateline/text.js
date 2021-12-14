import React from 'react';
import PropTypes from 'prop-types';
import util from '../../util/util';

/*
 * Builds an SVG text box
 *
 * @class LineText
 * @extends React.Component
 */
class LineText extends React.Component {
  /*
   * Sets state and extents props
   */
  constructor(props) {
    super(props);
    this.state = {
      active: false,
      dateRight: props.dateRight,
      dateLeft: props.dateLeft,
    };
  }

  render() {
    const { dateLeft, dateRight, active } = this.state;
    const {
      textWidth, recRadius, fill, textY, color, width, textOpacity, textHeight, rectOpacity,
    } = this.props;
    const leftTextWidth = Math.round(
      util.getTextWidth(dateLeft, '13px Open Sans') * 100,
    ) / 100 || textWidth;
    const rightTextWidth = Math.round(
      util.getTextWidth(dateRight, '13px Open Sans') * 100,
    ) / 100 || textWidth;
    const svgStyle = {
      position: 'absolute',
      transform: `translateX(${-(leftTextWidth + 25)}px)`,
      overflow: 'visible',
      width: '100px',
      userSelect: 'none',
      pointerEvents: 'none',
      left: '0',
    };
    return (
      <svg className="dateline-text" style={svgStyle}>
        <rect
          fill={fill}
          width={leftTextWidth + 10}
          height={textHeight}
          x={0}
          rx={recRadius}
          opacity={active && dateLeft ? rectOpacity : '0'}
        />
        <text
          y={textY}
          x={6}
          fill={color}
          width={width}
          opacity={active && dateLeft ? textOpacity : '0'}
        >
          {dateLeft}
        </text>
        <rect
          fill={fill}
          width={rightTextWidth + 10}
          height={textHeight}
          x={leftTextWidth + 40}
          rx={recRadius}
          opacity={active && dateRight ? rectOpacity : '0'}
        />
        <text
          y={textY}
          x={leftTextWidth + 46}
          fill={color}
          opacity={active && dateRight ? textOpacity : '0'}
        >
          {dateRight}
        </text>
      </svg>
    );
  }
}
LineText.defaultProps = {
  textOpacity: 0.7,
  rectOpacity: 1,
  width: '300',
  color: 'white',
  textY: 14,
  fill: 'rgba(40,40,40,0.75)',
  textWidth: 80,
  textHeight: 20,
  recRadius: 3,
};

LineText.propTypes = {
  color: PropTypes.string,
  dateLeft: PropTypes.string,
  dateRight: PropTypes.string,
  fill: PropTypes.string,
  recRadius: PropTypes.number,
  rectOpacity: PropTypes.number,
  textHeight: PropTypes.number,
  textOpacity: PropTypes.number,
  textWidth: PropTypes.number,
  textY: PropTypes.number,
  width: PropTypes.string,
};

export default LineText;
