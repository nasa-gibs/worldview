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
    const leftTextWidth = Math.round(
      util.getTextWidth(this.state.dateLeft, '13px Open Sans') * 100,
    ) / 100 || this.props.textWidth;
    const rightTextWidth = Math.round(
      util.getTextWidth(this.state.dateRight, '13px Open Sans') * 100,
    ) / 100 || this.props.textWidth;
    const svgStyle = {
      transform: `translateX(${-(leftTextWidth + 20)}px)`,
    };
    return (
      <svg className="dateline-text" style={svgStyle}>
        <rect
          fill={this.props.fill}
          width={leftTextWidth + 12}
          height={this.props.textHeight}
          x={0}
          rx={this.props.recRadius}
          opacity={
            this.state.active && this.state.dateLeft
              ? this.props.rectOpacity
              : '0'
          }
        />
        <text
          y={this.props.textY}
          x={6}
          fill={this.props.color}
          width={this.props.width}
          opacity={
            this.state.active && this.state.dateLeft
              ? this.props.textOpacity
              : '0'
          }
        >
          {this.state.dateLeft}
        </text>
        <rect
          fill={this.props.fill}
          width={rightTextWidth + 12}
          height={this.props.textHeight}
          x={leftTextWidth + 40}
          rx={this.props.recRadius}
          opacity={
            this.state.active && this.state.dateRight
              ? this.props.rectOpacity
              : '0'
          }
        />
        <text
          y={this.props.textY}
          x={leftTextWidth + 46}
          fill={this.props.color}
          opacity={
            this.state.active && this.state.dateRight
              ? this.props.textOpacity
              : '0'
          }
        >
          {this.state.dateRight}
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
  fill: 'rgba(40,40,40,0.5)',
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
  svgStyle: PropTypes.object,
  textHeight: PropTypes.number,
  textOpacity: PropTypes.number,
  textWidth: PropTypes.number,
  textY: PropTypes.number,
  width: PropTypes.string,
};

export default LineText;
