import React from 'react';
import PropTypes from 'prop-types';
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
      dateLeft: props.dateLeft
    };
  }

  render() {
    return (
      <svg className="dateline-text" style={this.props.svgStyle}>
        <rect
          fill={this.props.fill}
          width={this.props.textWidth}
          height={this.props.textHeight}
          x={this.props.x1}
          rx={this.props.recRadius}
          opacity={this.state.active ? this.props.rectOpacity : '0'}
        />
        <text
          y={this.props.textY}
          x={this.props.x1 + 6}
          fill={this.props.color}
          width={this.props.width}
          opacity={this.state.active ? this.props.textOpacity : '0'}
        >
          {this.state.dateLeft}
        </text>
        <rect
          fill={this.props.fill}
          width={this.props.textWidth}
          height={this.props.textHeight}
          x={this.props.x2}
          rx={this.props.recRadius}
          opacity={this.state.active ? this.props.rectOpacity : '0'}
        />
        <text
          y={this.props.textY}
          x={this.props.x2 + 6}
          fill={this.props.color}
          opacity={this.state.active ? this.props.textOpacity : '0'}
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
  x2: 155,
  x1: 45,
  textWidth: 80,
  textHeight: 20,
  recRadius: 3,
  svgStyle: {
    transform: 'translateX(-140px)'
  }
};

LineText.propTypes = {
  textOpacity: PropTypes.number,
  rectOpacity: PropTypes.number,
  width: PropTypes.string,
  color: PropTypes.string,
  textY: PropTypes.number,
  fill: PropTypes.string,
  dateLeft: PropTypes.string,
  dateRight: PropTypes.string,
  x2: PropTypes.number,
  x1: PropTypes.number,
  textWidth: PropTypes.number,
  textHeight: PropTypes.number,
  recRadius: PropTypes.number,
  svgStyle: PropTypes.object
};

export default LineText;
