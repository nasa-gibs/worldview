import React from 'react';
import PropTypes from 'prop-types';
import lodashRound from 'lodash/round';

class Pick extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      position: props.position,
      visibility: props.visibility,
      color: props.color,
      max: props.max
    };
  }
  /**
   * Return visibility style string
   */
  getVisibility() {
    var visibility = 'visible';
    if (this.state.position < 0 || this.state.position > this.state.max) {
      visibility = 'hidden';
    }
    return visibility;
  }
  /**
   * Return text el to show over dragger
   * @param {number} x | x offset
   * @param {number} y | y offset
   */
  getText(x, y, visibility) {
    if (this.props.text) {
      return (
        <text
          x={x}
          y={y}
          alignmentBaseline="middle"
          textAnchor="middle"
          style={{
            fill: this.state.textColor ? this.state.textColor : null,
            visibility: visibility || null
          }}
        >
          {this.props.text}
        </text>
      );
    }
  }
  render() {
    var visibility = this.getVisibility();
    const { yOffset, path, width, height } = this.props;
    const { position } = this.state;
    var translate = 'translate(' + position + ',' + yOffset + ')';
    return (
      <g transform={translate}>
        <path
          style={{
            fill: this.props.color ? this.props.color : null,
            visibility: visibility
          }}
          d={path}
          transform={'translate(' + -width / 2 + ', ' + -height / 4 + ')'}
        />
        {this.getText(-5, lodashRound(height / 6, 4), visibility)}
      </g>
    );
  }
}

Pick.propTypes = {
  position: PropTypes.number,
  height: PropTypes.number,
  width: PropTypes.number,
  path: PropTypes.string,
  visibility: PropTypes.string,
  color: PropTypes.string,
  text: PropTypes.string,
  yOffset: PropTypes.number,
  max: PropTypes.number
};

export default Pick;
