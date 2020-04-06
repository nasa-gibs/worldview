import React from 'react';
import PropTypes from 'prop-types';
import lodashRound from 'lodash/round';

class Pick extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      position: props.position,
      max: props.max,
    };
  }

  /**
   * Return visibility style string
   */
  getVisibility() {
    const { position, max } = this.state;
    let visibility = 'visible';
    if (position < 0 || position > max) {
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
    const { text } = this.props;
    const { textColor } = this.state;
    if (text) {
      return (
        <text
          x={x}
          y={y}
          alignmentBaseline="middle"
          textAnchor="middle"
          style={{
            fill: textColor || null,
            visibility: visibility || null,
          }}
        >
          {text}
        </text>
      );
    }
  }

  render() {
    const visibility = this.getVisibility();
    const {
      yOffset, path, width, height, color,
    } = this.props;
    const { position } = this.state;
    const translate = `translate(${position},${yOffset})`;
    return (
      <g transform={translate}>
        <path
          style={{
            fill: color || null,
            visibility,
          }}
          d={path}
          transform={`translate(${-width / 2}, ${-height / 4})`}
        />
        {this.getText(-5, lodashRound(height / 6, 4), visibility)}
      </g>
    );
  }
}

Pick.propTypes = {
  color: PropTypes.string,
  height: PropTypes.number,
  max: PropTypes.number,
  path: PropTypes.string,
  position: PropTypes.number,
  text: PropTypes.string,
  width: PropTypes.number,
  yOffset: PropTypes.number,
};

export default Pick;
